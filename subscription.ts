export const TRIAL_DAYS = 7
export const TRIAL_RECORD_LIMIT = 3
export const GRACE_PERIOD_DAYS = 3

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'

export type Subscription = {
  status: SubscriptionStatus
  plan: 'trial' | 'essencial' | 'profissional'
  trialEndsAt: string
  currentPeriodEnd: string
  pastDueSince: string | null
  provider: 'stripe' | 'asaas' | null
  recordsCreated: number
}

export type Access = {
  canRead: boolean
  canCreateRecord: boolean
  reason: string | null
  daysLeft: number | null
}

const DAY = 86_400_000

/**
 * Regra central de acesso. Deve ser usada tanto na UI quanto no servidor
 * (rotas de criação de prontuário) para garantir o bloqueio real.
 */
export function evaluateAccess(sub: Subscription, now = new Date()): Access {
  if (sub.status === 'trialing') {
    const daysLeft = Math.ceil((new Date(sub.trialEndsAt).getTime() - now.getTime()) / DAY)
    if (daysLeft <= 0) {
      return { canRead: true, canCreateRecord: false, reason: 'Seu período de teste de 7 dias terminou.', daysLeft: 0 }
    }
    if (sub.recordsCreated >= TRIAL_RECORD_LIMIT) {
      return {
        canRead: true,
        canCreateRecord: false,
        reason: `Você atingiu o limite de ${TRIAL_RECORD_LIMIT} prontuários do teste gratuito.`,
        daysLeft,
      }
    }
    return { canRead: true, canCreateRecord: true, reason: null, daysLeft }
  }

  if (sub.status === 'past_due' && sub.pastDueSince) {
    const overdueDays = Math.floor((now.getTime() - new Date(sub.pastDueSince).getTime()) / DAY)
    if (overdueDays >= GRACE_PERIOD_DAYS) {
      return {
        canRead: true,
        canCreateRecord: false,
        reason: `Pagamento em atraso há ${overdueDays} dias. A criação de prontuários está bloqueada; seu histórico continua disponível para leitura.`,
        daysLeft: null,
      }
    }
    return {
      canRead: true,
      canCreateRecord: true,
      reason: `Pagamento pendente. Regularize em até ${GRACE_PERIOD_DAYS - overdueDays} dia(s) para evitar bloqueio.`,
      daysLeft: GRACE_PERIOD_DAYS - overdueDays,
    }
  }

  if (sub.status === 'canceled' || sub.status === 'expired') {
    return { canRead: true, canCreateRecord: false, reason: 'Assinatura inativa. Reative para criar novos prontuários.', daysLeft: null }
  }

  return { canRead: true, canCreateRecord: true, reason: null, daysLeft: null }
}

export const plans = [
  {
    id: 'essencial' as const,
    name: 'Essencial',
    price: 69,
    description: 'Para quem está começando o consultório.',
    features: ['Até 60 prontuários/mês', 'Transcrição em tempo real', 'Agenda + Google Calendar', 'Recibos em PDF'],
  },
  {
    id: 'profissional' as const,
    name: 'Profissional',
    price: 129,
    description: 'Prontuários ilimitados e supervisão com IA.',
    features: ['Prontuários ilimitados', 'Copiloto clínico em tempo real', 'Sophia — supervisão com IA', 'Financeiro completo', 'Suporte prioritário'],
    highlighted: true,
  },
]

const now = Date.now()
export const demoSubscription: Subscription = {
  status: 'trialing',
  plan: 'trial',
  trialEndsAt: new Date(now + 5 * DAY).toISOString(),
  currentPeriodEnd: new Date(now + 5 * DAY).toISOString(),
  pastDueSince: null,
  provider: null,
  recordsCreated: 1,
}
