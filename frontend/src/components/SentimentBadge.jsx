import React from 'react'

const SENTIMENT_CONFIG = {
  positive:  { bg: 'rgba(45,212,191,0.12)',  color: '#2dd4bf',  label: 'Positive' },
  neutral:   { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8',  label: 'Neutral' },
  frustrated:{ bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24',  label: 'Frustrated' },
  negative:  { bg: 'rgba(248,113,113,0.12)', color: '#f87171',  label: 'Negative' },
}

export default function SentimentBadge({ sentiment }) {
  const cfg = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.neutral
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
