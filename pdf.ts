'use client'

import type { jsPDF as JsPDF } from 'jspdf'

const INDIGO: [number, number, number] = [99, 102, 241]
const GRAPHITE: [number, number, number] = [17, 24, 39]
const GRAY: [number, number, number] = [107, 114, 128]
const LILAC: [number, number, number] = [238, 242, 255]

async function createDoc() {
  const { jsPDF } = await import('jspdf')
  return new jsPDF({ unit: 'mm', format: 'a4' })
}

function header(doc: JsPDF, title: string, subtitle: string) {
  doc.setFillColor(...INDIGO)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('AcolheApp', 16, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(subtitle, 16, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(title, 194, 16, { align: 'right' })
}

function footer(doc: JsPDF) {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(229, 231, 235)
    doc.line(16, 282, 194, 282)
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY)
    doc.text(
      'Documento sigiloso — Código de Ética Profissional do Psicólogo (Res. CFP 010/2005) e LGPD (Lei 13.709/2018).',
      16,
      287,
    )
    doc.text(`Página ${i} de ${pages}`, 194, 287, { align: 'right' })
  }
}

export type RecordPdfInput = {
  patient: string
  therapist: string
  crp: string
  date: string
  sections: { label: string; content: string }[]
}

export async function exportRecordPdf(input: RecordPdfInput) {
  const doc = await createDoc()
  header(doc, 'Prontuário de Atendimento', `${input.therapist} · ${input.crp}`)

  doc.setTextColor(...GRAPHITE)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Paciente:', 16, 40)
  doc.setFont('helvetica', 'normal')
  doc.text(input.patient, 36, 40)
  doc.setFont('helvetica', 'bold')
  doc.text('Data:', 130, 40)
  doc.setFont('helvetica', 'normal')
  doc.text(input.date, 142, 40)

  let y = 52
  for (const section of input.sections) {
    const lines = doc.splitTextToSize(section.content || '—', 170) as string[]
    const blockHeight = 12 + lines.length * 5
    if (y + blockHeight > 275) {
      doc.addPage()
      y = 20
    }
    doc.setFillColor(...LILAC)
    doc.roundedRect(16, y - 5, 40, 8, 3, 3, 'F')
    doc.setTextColor(...INDIGO)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(section.label.toUpperCase(), 20, y)
    doc.setTextColor(...GRAPHITE)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(lines, 16, y + 9)
    y += blockHeight + 6
  }

  footer(doc)
  doc.save(`prontuario-${slug(input.patient)}-${input.date.replaceAll('/', '-')}.pdf`)
}

export type ReceiptPdfInput = {
  number: string
  patient: string
  therapist: string
  crp: string
  amount: number
  amountLabel: string
  description: string
  date: string
  method: string
}

export async function exportReceiptPdf(input: ReceiptPdfInput) {
  const doc = await createDoc()
  header(doc, `Recibo Nº ${input.number}`, `${input.therapist} · ${input.crp}`)

  doc.setFillColor(...LILAC)
  doc.roundedRect(16, 40, 178, 26, 4, 4, 'F')
  doc.setTextColor(...GRAY)
  doc.setFontSize(9)
  doc.text('VALOR RECEBIDO', 24, 50)
  doc.setTextColor(...INDIGO)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(input.amountLabel, 24, 60)

  doc.setTextColor(...GRAPHITE)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const body = `Recebi de ${input.patient} a importância de ${input.amountLabel}, referente a ${input.description.toLowerCase()} de psicoterapia, realizada em ${input.date}, paga via ${input.method}.`
  doc.text(doc.splitTextToSize(body, 178) as string[], 16, 82)

  doc.text(`Emitido em ${new Date().toLocaleDateString('pt-BR')}`, 16, 112)
  doc.setDrawColor(...GRAY)
  doc.line(110, 140, 194, 140)
  doc.setFontSize(10)
  doc.text(input.therapist, 152, 146, { align: 'center' })
  doc.setTextColor(...GRAY)
  doc.setFontSize(9)
  doc.text(`Psicóloga · ${input.crp}`, 152, 151, { align: 'center' })

  footer(doc)
  doc.save(`recibo-${input.number}-${slug(input.patient)}.pdf`)
}

function slug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
}
