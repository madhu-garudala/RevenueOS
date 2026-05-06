import React from 'react'
import { formatTime } from '../utils/formatters.js'

const AVATAR_COLORS = ['#2dd4bf', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa']

function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function SlackMonitor({ leads }) {
  const slackLeads = leads
    .filter((l) => l.channel === 'slack')
    .slice(0, 5)

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
          Slack Activity
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2dd4bf' }} />
          <span style={{ fontSize: '10px', color: '#2dd4bf' }}>Live</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {slackLeads.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
            No Slack messages yet
          </div>
        ) : (
          slackLeads.map((lead, idx) => (
            <div
              key={lead.leadId}
              style={{
                padding: '8px 10px',
                borderBottom: '0.5px solid #1e3a5f',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '8px',
                    fontWeight: 700,
                    color: '#060e1d',
                  }}
                >
                  {initials(lead.name)}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#e2e8f0', flex: 1 }}>
                  {lead.name}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>
                  {formatTime(lead.created_at)}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5, paddingLeft: '25px' }}>
                {lead.message && lead.message.length > 100
                  ? lead.message.slice(0, 100) + '…'
                  : lead.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
