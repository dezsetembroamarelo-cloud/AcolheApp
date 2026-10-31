import { createHmac, timingSafeEqual } from 'node:crypto'
import { applyBillingEvent, type BillingEvent } from '@/lib/billing'

const TOLERANCE_SECONDS = 300

function verifyStripeSignature(payload: string, header: string | null, secret: string) {
  if (!header) return false
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]))
  const timestamp = Number(parts.t)
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false
  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
  const received = parts.v1 ?? ''
  return expected.length === received.length && timingSafeEqual(Buffer.from(expected), Buffer.from(received))
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return Response.json({ error: 'Webhook não configurado' }, { status: 501 })

  const payload = await req.text()
  if (!verifyStripeSignature(payload, req.headers.get('stripe-signature'), secret)) {
    return Response.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  const event = JSON.parse(payload)
  const object = event.data?.object ?? {}
  const customerId: string | undefined = object.customer

  const map: Record<string, BillingEvent['type'] | undefined> = {
    'invoice.paid': 'payment_succeeded',
    'invoice.payment_failed': 'payment_failed',
    'customer.subscription.deleted': 'subscription_canceled',
    'customer.subscription.updated': 'subscription_updated',
  }
  const type = map[event.type]

  if (type && customerId) {
    await applyBillingEvent({
      provider: 'stripe',
      eventId: event.id,
      type,
      customerId,
      amountCents: object.amount_paid ?? object.amount_due ?? null,
      invoiceUrl: object.hosted_invoice_url ?? null,
      periodEnd: object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null,
    })
  }

  return Response.json({ received: true })
}
