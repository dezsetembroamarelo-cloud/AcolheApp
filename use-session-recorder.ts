'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type Segment = { id: string; speaker: string; text: string; at: number }
export type RecorderMode = 'idle' | 'mic' | 'demo'

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
}

const demoScript: Omit<Segment, 'id' | 'at'>[] = [
  { speaker: 'Terapeuta', text: 'Como você chegou hoje? Como foi a sua semana desde o nosso último encontro?' },
  { speaker: 'Paciente', text: 'Foi uma semana difícil. Tive duas crises de ansiedade no trabalho, principalmente antes da reunião de segunda.' },
  { speaker: 'Paciente', text: 'Senti o coração acelerado, falta de ar, e fiquei pensando que todo mundo ia perceber que eu não sei o que estou fazendo.' },
  { speaker: 'Terapeuta', text: 'Você conseguiu usar a respiração diafragmática que treinamos na última sessão?' },
  { speaker: 'Paciente', text: 'Na segunda vez sim. Ajudou a passar mais rápido, mas o pensamento de que vou ser demitida continuou.' },
  { speaker: 'Terapeuta', text: 'Que evidências você tem de que vai ser demitida? E quais evidências apontam no sentido contrário?' },
  { speaker: 'Paciente', text: 'Na verdade minha gestora elogiou meu relatório semana passada. Mas eu sempre acho que foi sorte.' },
  { speaker: 'Paciente', text: 'Também tenho dormido mal, acordo umas três da manhã e fico repassando tudo o que fiz de errado.' },
  { speaker: 'Terapeuta', text: 'Vamos combinar de registrar esses pensamentos automáticos durante a semana, com a situação, a emoção e uma resposta alternativa.' },
  { speaker: 'Paciente', text: 'Combinado. Acho que escrever vai me ajudar a enxergar com mais clareza.' },
]

export function useSessionRecorder() {
  const [mode, setMode] = useState<RecorderMode>('idle')
  const [paused, setPaused] = useState(false)
  const [segments, setSegments] = useState<Segment[]>([])
  const [interim, setInterim] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const demoIndexRef = useRef(0)
  const activeRef = useRef(false)
  const pausedRef = useRef(false)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    if (mode === 'idle' || paused) return
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [mode, paused])

  useEffect(() => {
    if (mode !== 'demo' || paused) return
    const id = window.setInterval(() => {
      const line = demoScript[demoIndexRef.current]
      if (!line) return
      demoIndexRef.current += 1
      setSegments((prev) => [...prev, { ...line, id: crypto.randomUUID(), at: Date.now() }])
    }, 2600)
    return () => window.clearInterval(id)
  }, [mode, paused])

  const cleanup = useCallback(() => {
    activeRef.current = false
    recognitionRef.current?.stop()
    recognitionRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    setAnalyser(null)
    setInterim('')
  }, [])

  useEffect(() => cleanup, [cleanup])

  const startMic = useCallback(async () => {
    setError(null)
    const SR =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      streamRef.current = stream
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const node = ctx.createAnalyser()
      node.fftSize = 128
      ctx.createMediaStreamSource(stream).connect(node)
      setAnalyser(node)
    } catch {
      setError('Não foi possível acessar o microfone. Verifique a permissão do navegador ou use o modo demonstração.')
      return
    }

    activeRef.current = true
    setMode('mic')
    setPaused(false)

    if (!SR) {
      setError('Seu navegador não suporta transcrição em tempo real. Use o Google Chrome ou Microsoft Edge.')
      return
    }

    const recognition = new SR()
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript.trim()
        if (!text) continue
        if (result.isFinal) {
          setSegments((prev) => [...prev, { id: crypto.randomUUID(), speaker: 'Fala', text, at: Date.now() }])
        } else {
          interimText += `${text} `
        }
      }
      setInterim(interimText)
    }
    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') setError('Permissão de transcrição negada pelo navegador.')
    }
    // O Chrome encerra o reconhecimento após silêncio; reiniciamos enquanto a sessão estiver ativa.
    recognition.onend = () => {
      if (activeRef.current && !pausedRef.current) {
        try {
          recognition.start()
        } catch {}
      }
    }
    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const startDemo = useCallback(() => {
    cleanup()
    setError(null)
    demoIndexRef.current = 0
    setSegments([])
    setElapsed(0)
    setPaused(false)
    setMode('demo')
  }, [cleanup])

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p
      if (recognitionRef.current) {
        if (next) recognitionRef.current.stop()
        else {
          try {
            recognitionRef.current.start()
          } catch {}
        }
      }
      if (audioCtxRef.current) {
        if (next) audioCtxRef.current.suspend()
        else audioCtxRef.current.resume()
      }
      return next
    })
  }, [])

  const stop = useCallback(() => {
    cleanup()
    setMode('idle')
    setPaused(false)
  }, [cleanup])

  const reset = useCallback(() => {
    stop()
    setSegments([])
    setElapsed(0)
    demoIndexRef.current = 0
  }, [stop])

  return { mode, paused, segments, interim, elapsed, error, analyser, startMic, startDemo, togglePause, stop, reset }
}
