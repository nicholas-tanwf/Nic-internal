import { useEffect, useRef, useState } from 'react'

export function useSpeechToText() {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const onTextRef = useRef(null)
  const lastProcessedIndex = useRef(-1) // Track which results we've processed
  const transcriptRef = useRef('') // Full accumulated transcript

  useEffect(() => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Rec) return
    setSupported(true)
    
    const r = new Rec()
    r.continuous = true
    r.interimResults = true
    r.lang = 'en-US'
    r.maxAlternatives = 1
    recognitionRef.current = r

    r.onstart = () => {
      setError(null)
      setListening(true)
    }
    
    r.onend = () => {
      setListening(false)
    }
    
    r.onerror = (e) => {
      if (e?.error !== 'no-speech' && e?.error !== 'aborted') {
        setError(e?.error ?? 'speech_error')
      }
    }

    r.onresult = (event) => {
      // Build transcript by looking at ALL results
      // But only count FINAL results for the permanent transcript
      let finalParts = []
      let interimPart = ''
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0]?.transcript?.trim() ?? ''
        
        if (result.isFinal) {
          // This is a finalized result - add to permanent parts
          if (transcript) {
            finalParts.push(transcript)
          }
        } else {
          // This is still being processed - show as interim
          interimPart = transcript
        }
      }
      
      // Combine: all final parts + current interim
      const fullTranscript = [...finalParts, interimPart].filter(Boolean).join(' ')
      transcriptRef.current = fullTranscript
      onTextRef.current?.(fullTranscript)
    }

    return () => {
      try {
        r.abort()
      } catch {
        // ignore
      }
    }
  }, [])

  const start = ({ onText, appendTo = '' }) => {
    const r = recognitionRef.current
    if (!r) return

    // Reset tracking
    lastProcessedIndex.current = -1
    transcriptRef.current = appendTo
    onTextRef.current = onText
    
    // If there's existing text, prepend it
    if (appendTo) {
      onText(appendTo)
    }

    try {
      r.start()
    } catch {
      // might already be running
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

export function useCountdown({ totalSeconds, running, onDone, stepKey = 0 }) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const onDoneRef = useRef(onDone)
  const hasCalledDone = useRef(false)
  const justSeeked = useRef(false) // Prevent immediate done after seek
  const totalSecondsRef = useRef(totalSeconds) // Track totalSeconds for validation
  const intervalRef = useRef(null) // Store interval ID for proper cleanup
  const currentStepKey = useRef(stepKey) // Track which step we're counting for
  
  // Keep refs updated
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])
  
  useEffect(() => {
    totalSecondsRef.current = totalSeconds
  }, [totalSeconds])
  
  // Track current step key
  useEffect(() => {
    currentStepKey.current = stepKey
  }, [stepKey])

  // Reset countdown completely when step changes
  useEffect(() => {
    // Clear any running interval immediately
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Reset all state for new step
    hasCalledDone.current = false
    justSeeked.current = false
    
    if (totalSeconds > 0) {
      setSecondsLeft(totalSeconds)
    }
  }, [stepKey, totalSeconds])

  useEffect(() => {
    // Clear any existing interval immediately
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Don't start countdown if not running or no valid duration
    if (!running || totalSeconds <= 0) return
    
    // Capture the step key at the start
    const startStepKey = stepKey
    
    // Reset done flag when starting fresh
    hasCalledDone.current = false
    
    // Small delay to ensure state is synchronized after step transition
    const startDelay = setTimeout(() => {
      // Verify we're still on the same step before starting interval
      if (currentStepKey.current !== startStepKey) return
      
      intervalRef.current = window.setInterval(() => {
        // Verify we're still on the same step
        if (currentStepKey.current !== startStepKey) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return
        }
        
        setSecondsLeft((s) => {
          // If we just seeked, skip this tick's done check
          if (justSeeked.current) {
            justSeeked.current = false
            return Math.max(s - 1, 0)
          }
          
          // Extra validation: only trigger done if totalSeconds is valid and same step
          if (s <= 1 && totalSecondsRef.current > 0 && currentStepKey.current === startStepKey) {
            if (intervalRef.current) {
              window.clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            // Only call onDone once per countdown cycle
            if (!hasCalledDone.current) {
              hasCalledDone.current = true
              // Use setTimeout to avoid state update during render
              setTimeout(() => {
                // Final verification before calling onDone
                if (currentStepKey.current === startStepKey) {
                  onDoneRef.current?.()
                }
              }, 50)
            }
            return 0
          }
          return Math.max(s - 1, 0)
        })
      }, 1000)
    }, 150) // Slightly longer delay to ensure React state has settled
    
    return () => {
      clearTimeout(startDelay)
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running, totalSeconds, stepKey])

  // Seek to a specific elapsed time (minimum 10 seconds remaining to prevent transition issues)
  const seekTo = (elapsedSeconds) => {
    const minRemaining = 10 // 10 second buffer before end
    const newSecondsLeft = Math.max(minRemaining, totalSeconds - elapsedSeconds)
    justSeeked.current = true // Mark that we just seeked
    hasCalledDone.current = false // Allow done to fire again if needed
    setSecondsLeft(newSecondsLeft)
  }

  return { secondsLeft, seekTo }
}

