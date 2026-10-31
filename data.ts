export type Patient = {
  id: string
  name: string
  initials: string
  sessionFee: number
  approach: string
}

export type Appointment = {
  id: string
  patientId: string
  date: string
  start: string
  end: string
  modality: 'presencial' | 'online'
  status: 'confirmado' | 'pendente' | 'cancelado'
  googleSynced: boolean
}

export type Payment = {
  id: string
  patientId: string
  date: string
  description: string
  amount: number
  method: 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência'
  status: 'pago' | 'pendente' | 'atrasado'
}

export const patients: Patient[] = [
  { id: 'p1', name: 'Mariana Alves', initials: 'MA', sessionFee: 220, approach: 'TCC' },
  { id: 'p2', name: 'Rafael Monteiro', initials: 'RM', sessionFee: 200, approach: 'Psicanálise' },
  { id: 'p3', name: 'Juliana Prado', initials: 'JP', sessionFee: 250, approach: 'TCC' },
  { id: 'p4', name: 'Bruno Carvalho', initials: 'BC', sessionFee: 180, approach: 'ACT' },
  { id: 'p5', name: 'Letícia Nunes', initials: 'LN', sessionFee: 220, approach: 'Humanista' },
  { id: 'p6', name: 'Thiago Ribeiro', initials: 'TR', sessionFee: 200, approach: 'TCC' },
]

export function getPatient(id: string) {
  return patients.find((p) => p.id === id)
}

function isoDay(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export const appointments: Appointment[] = [
  { id: 'a1', patientId: 'p1', date: isoDay(0), start: '08:00', end: '08:50', modality: 'presencial', status: 'confirmado', googleSynced: true },
  { id: 'a2', patientId: 'p2', date: isoDay(0), start: '10:00', end: '10:50', modality: 'online', status: 'confirmado', googleSynced: true },
  { id: 'a3', patientId: 'p3', date: isoDay(0), start: '14:00', end: '14:50', modality: 'presencial', status: 'pendente', googleSynced: false },
  { id: 'a4', patientId: 'p4', date: isoDay(0), start: '16:00', end: '16:50', modality: 'online', status: 'confirmado', googleSynced: true },
  { id: 'a5', patientId: 'p5', date: isoDay(1), start: '09:00', end: '09:50', modality: 'presencial', status: 'confirmado', googleSynced: true },
  { id: 'a6', patientId: 'p6', date: isoDay(1), start: '11:00', end: '11:50', modality: 'online', status: 'pendente', googleSynced: false },
  { id: 'a7', patientId: 'p1', date: isoDay(2), start: '08:00', end: '08:50', modality: 'presencial', status: 'confirmado', googleSynced: true },
  { id: 'a8', patientId: 'p3', date: isoDay(3), start: '15:00', end: '15:50', modality: 'online', status: 'confirmado', googleSynced: true },
  { id: 'a9', patientId: 'p2', date: isoDay(4), start: '10:00', end: '10:50', modality: 'presencial', status: 'cancelado', googleSynced: true },
  { id: 'a10', patientId: 'p4', date: isoDay(-1), start: '13:00', end: '13:50', modality: 'online', status: 'confirmado', googleSynced: true },
  { id: 'a11', patientId: 'p5', date: isoDay(-2), start: '17:00', end: '17:50', modality: 'presencial', status: 'confirmado', googleSynced: true },
  { id: 'a12', patientId: 'p6', date: isoDay(6), start: '09:00', end: '09:50', modality: 'online', status: 'confirmado', googleSynced: false },
  { id: 'a13', patientId: 'p1', date: isoDay(9), start: '08:00', end: '08:50', modality: 'presencial', status: 'confirmado', googleSynced: true },
  { id: 'a14', patientId: 'p3', date: isoDay(12), start: '14:00', end: '14:50', modality: 'presencial', status: 'pendente', googleSynced: false },
]

export const payments: Payment[] = [
  { id: 'f1', patientId: 'p1', date: isoDay(-1), description: 'Sessão individual', amount: 220, method: 'PIX', status: 'pago' },
  { id: 'f2', patientId: 'p2', date: isoDay(-2), description: 'Sessão individual', amount: 200, method: 'Cartão', status: 'pago' },
  { id: 'f3', patientId: 'p3', date: isoDay(-3), description: 'Pacote mensal (4 sessões)', amount: 900, method: 'PIX', status: 'pendente' },
  { id: 'f4', patientId: 'p4', date: isoDay(-8), description: 'Sessão individual', amount: 180, method: 'PIX', status: 'atrasado' },
  { id: 'f5', patientId: 'p5', date: isoDay(-5), description: 'Sessão individual', amount: 220, method: 'Transferência', status: 'pago' },
  { id: 'f6', patientId: 'p6', date: isoDay(-6), description: 'Sessão individual', amount: 200, method: 'Dinheiro', status: 'pago' },
  { id: 'f7', patientId: 'p1', date: isoDay(-8), description: 'Sessão individual', amount: 220, method: 'PIX', status: 'pago' },
  { id: 'f8', patientId: 'p2', date: isoDay(-10), description: 'Sessão individual', amount: 200, method: 'Cartão', status: 'pendente' },
  { id: 'f9', patientId: 'p5', date: isoDay(-12), description: 'Avaliação inicial', amount: 300, method: 'PIX', status: 'pago' },
]

export const monthlyRevenue = [
  { month: 'Mai', value: 6200 },
  { month: 'Jun', value: 7100 },
  { month: 'Jul', value: 6800 },
  { month: 'Ago', value: 7900 },
  { month: 'Set', value: 8400 },
  { month: 'Out', value: 9150 },
]

export const therapist = {
  name: 'Dra. Camila Souza',
  initials: 'CS',
  crp: 'CRP 06/123456',
  email: 'camila@consultorio.com.br',
}

export const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', opts ?? { day: '2-digit', month: 'short' })
}
