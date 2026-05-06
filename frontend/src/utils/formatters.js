export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function formatRelative(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

export function statusColor(status) {
  const map = {
    NEW: '#64748b',
    ANALYZED: '#60a5fa',
    EXECUTING: '#fbbf24',
    COMPLETED: '#2dd4bf',
    FOLLOW_UP_SENT: '#f87171',
    DEAD: '#64748b',
    FAILED: '#f87171',
    ESCALATED: '#f87171',
  }
  return map[status] || '#64748b'
}
