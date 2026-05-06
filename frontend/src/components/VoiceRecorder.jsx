import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { submitTranscript } from '../utils/api.js'
import TranscriptCard from './TranscriptCard.jsx'

export default function VoiceRecorder() {
  const [recording, setRecording] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [transcript, setTranscript] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
    } catch (e) {
      setError('Microphone access denied')
    }
  }

  async function stopRecording() {
    setRecording(false)
    const mr = mediaRecorderRef.current
    if (!mr) return

    await new Promise((resolve) => {
      mr.onstop = resolve
      mr.stop()
      mr.stream.getTracks().forEach((t) => t.stop())
    })

    setAnalysing(true)
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      // Convert to base64
      const arrayBuffer = await blob.arrayBuffer()
      const uint8 = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < uint8.byteLength; i++) {
        binary += String.fromCharCode(uint8[i])
      }
      const base64 = btoa(binary)

      const result = await submitTranscript(base64)
      setTranscript(result.transcript)
      setAnalysis(result.analysis)
    } catch (e) {
      setError('Analysis failed: ' + e.message)
    } finally {
      setAnalysing(false)
    }
  }

  function handleMicClick() {
    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div
      style={{
        background: '#0d1f38',
        border: '0.5px solid #1e3a5f',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '0.5px solid #1e3a5f',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Call Intelligence
        </span>
        <span
          style={{
            fontSize: '9px',
            padding: '2px 7px',
            borderRadius: '3px',
            background: 'rgba(45,212,191,0.08)',
            color: '#2dd4bf',
            border: '0.5px solid rgba(45,212,191,0.2)',
          }}
        >
          AWS Transcribe
        </span>
      </div>

      <div style={{ padding: '14px' }}>
        {/* Mic button area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          {/* Outer ring */}
          <motion.div
            animate={recording ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={recording ? { duration: 1.2, repeat: Infinity } : {}}
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              border: recording ? '1px solid #2dd4bf' : '0.5px solid rgba(45,212,191,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Inner mic button */}
            <button
              onClick={handleMicClick}
              disabled={analysing}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: `1.5px solid #2dd4bf`,
                background: recording ? 'rgba(248,113,113,0.10)' : 'rgba(45,212,191,0.05)',
                cursor: analysing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
            >
              {analysing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: '18px', height: '18px', border: '2px solid #2dd4bf', borderTopColor: 'transparent', borderRadius: '50%' }}
                />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="12" rx="3" stroke={recording ? '#f87171' : '#2dd4bf'} strokeWidth="2" />
                  <path d="M5 10a7 7 0 0 0 14 0" stroke={recording ? '#f87171' : '#2dd4bf'} strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="19" x2="12" y2="22" stroke={recording ? '#f87171' : '#2dd4bf'} strokeWidth="2" strokeLinecap="round" />
                  <line x1="8" y1="22" x2="16" y2="22" stroke={recording ? '#f87171' : '#2dd4bf'} strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </motion.div>

          <div>
            <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500, textAlign: 'center' }}>
              {analysing ? 'Analysing call…' : recording ? 'Recording…' : 'Live Call Analysis'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', marginTop: '2px' }}>
              {analysing
                ? 'AWS Transcribe + Bedrock processing'
                : recording
                ? 'Click to stop recording'
                : 'Tap to record · AI extracts intent, action items & deal risk'}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: '11px', color: '#f87171', textAlign: 'center', marginBottom: '8px' }}>
            {error}
          </div>
        )}

        <TranscriptCard transcript={transcript} analysis={analysis} />
      </div>
    </div>
  )
}
