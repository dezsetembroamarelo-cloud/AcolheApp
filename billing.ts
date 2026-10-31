import type { SubscriptionStatus } from './subscription'

export type BillingEvent = {
  provider: 'stripe' | 'asaas'
  eventId: string
  type: 'payment_succeeded' | 'payment_failed' | 'subscription_canceled' | 'subscription_updated'
  customerId: string
  amountCents: number | null
  invoiceUrl: string | null
  periodEnd: string | null
}

export function nextStatus(event: BillingEvent): { status: SubscriptionStatus; setPastDueSince: 'now' | 'clear' | 'keep' } {
  switch (event.type) {
    case 'payment_succeeded':
      return { status: 'active', setPastDueSince: 'clear' }
    case 'payment_failed':
      return { status: 'past_due', setPastDueSince: 'keep' }
    case 'subscription_canceled':
      return { status: 'canceled', setPastDueSince: 'keep' }
    default:
      return { status: 'active', setPastDueSince: 'keep' }
  }
}

/**
 * Persiste o evento de cobrança de forma idempotente.
 * Com o banco conectado (ver scripts/001_acolheapp_schema.sql), implemente:
 *   1. INSERT INTO billing_events (provider, provider_event_id, ...) ON CONFLICT DO NOTHING — se já existir, retorne.
 *   2. UPDATE subscriptions SET status = $status,
 *        past_due_since = CASE WHEN $set = 'clear' THEN NULL
 *                              WHEN past_due_since IS NULL AND $status = 'past_due' THEN now()
 *                              ELSE past_due_since END,
 *        current_period_end = COALESCE($periodEnd, current_period_end)
 *      WHERE provider_customer_id = $customerId.
 *   3. Em payment_succeeded, INSERT INTO invoices (...) com invoice_url.
 */
export async function applyBillingEvent(event: BillingEvent) {
  const transition = nextStatus(event)
  console.log('[acolheapp:billing]', event.provider, event.type, event.customerId, '→', transition.status)
  return transition
}
