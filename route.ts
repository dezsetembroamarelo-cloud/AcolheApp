import { NextResponse } from 'next/server'
import { z } from 'zod'
import { plans } from '@/lib/subscription'

const bodySchema = z.object({
  planId: z.enum(['essencial', 'profissional']),
  method: z.enum(['cartao', 'pix']),
})

/**
 * Cria a sessão de checkout no provedor. Cartão recorrente → Stripe Checkout (mode: subscription).
 * PIX automático → Asaas (POST /v3/subscriptions com billingType: PIX).
 * O preço é sempre resolvido no servidor a partir do planId.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 })

  const plan = plans.find((p) => p.id === parsed.data.planId)!
  const provider = parsed.data.method === 'pix' ? 'Asaas' : 'Stripe'
  const configured = parsed.data.method === 'pix' ? process.env.ASAAS_API_KEY : process.env.STRIPE_SECRET_KEY

  if (!configured) {
    return NextResponse.json({
      message: `Checkout do plano ${plan.name} via ${provider} pronto para integração. Configure as credenciais do ${provider} para ativar a cobrança.`,
    })
  }

  return NextResponse.json({ message: `Integração ${provider} configurada — implemente a criação da sessão aqui.` })
}
