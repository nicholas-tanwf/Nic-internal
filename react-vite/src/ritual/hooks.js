import { useEffect, useRef, useState } from 'react'

export function useSpeechToText() {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Rec) return
    setSupported(true)
    const r = new Rec()
    r.continuous = false
    r.interimResults = true
    r.lang = 'en-US'
    recognitionRef.current = r

    r.onstart = () => {
      setError(null)
      setListening(true)
    }
    r.onend = () => setListening(false)
    r.onerror = (e) => setError(e?.error ?? 'speech_error')

    return () => {
      try {
        r.abort()
      } catch {
        // ignore
      }
    }
  }, [])

  const start = ({ onText }) => {
    const r = recognitionRef.current
    if (!r) return

    r.onresult = (event) => {
      let combined = ''
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0]?.transcript ?? ''
      }
      onText(combined)
    }

    try {
      r.start()
    } catch {
      // ignore
    }
  }

  const stop = () => {
    const r = recognitionRef.current
    if (!r) return
    try {
      r.stop()
    } catch {
      // ignore
    }
  }

  return { supported, listening, error, start, stop }
}

export function useCountdown({ totalSeconds, running, onDone }) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)

  useEffect(() => {
    setSecondsLeft(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id)
          onDone?.()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running, onDone])

  return secondsLeft
}

