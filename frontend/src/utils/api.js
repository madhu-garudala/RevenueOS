import { API_BASE_URL } from '../config.js'

export async function fetchLeads() {
  const res = await fetch(`${API_BASE_URL}/leads`)
  if (!res.ok) throw new Error('Failed to fetch leads')
  return res.json()
}

export async function submitEvent(payload) {
  const res = await fetch(`${API_BASE_URL}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to submit event')
  return res.json()
}

export async function submitTranscript(audioBase64, meta = {}) {
  const res = await fetch(`${API_BASE_URL}/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio: audioBase64, ...meta }),
  })
  if (!res.ok) throw new Error('Failed to submit transcript')
  return res.json()
}
