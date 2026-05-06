import React from 'react'

const URGENCY_CONFIG = {
  high:   { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: 'HIGH' },
  medium: { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', label: 'MED' },
  low:    { bg: 'rgba(100,116,139,0.12)', color: '#64748b', label: 'LOW' },
}

export default function UrgencyBadge({ urgency }) {
  const cfg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.low
  return (
    <span
      style={{
        fontSize: '10px',
        padding: '2px 7px',
        borderRadius: '3px',
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  )
}
