import React from 'react'

export default function Footer({ leads }) {
  const scheduledCount = (leads || []).filter((l) => l.followup_scheduled && !l.followup_sent).length

  const stats = [
    { label: 'AWS Region', value: 'us-east-1' },
    { label: 'Bedrock', value: 'claude-sonnet-4-6' },
    { label: 'Step Functions', value: 'Active' },
    { label: 'EventBridge', value: `${scheduledCount} rules scheduled` },
  ]

  return (
    <div
      style={{
        background: '#060e1d',
        borderTop: '0.5px solid #1e3a5f',
        padding: '7px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', gap: '18px' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#64748b' }}>{s.label}:</span>
            <span style={{ fontSize: '10px', color: '#2dd4bf', fontWeight: 500 }}>{s.value}</span>
          </div>
        ))}
      </div>
      <span style={{ fontSize: '10px', color: '#1e3a5f' }}>RevenueOS · AWS Hackathon 2026</span>
    </div>
  )
}
