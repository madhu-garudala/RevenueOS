import React from 'react'
import { formatTime } from '../utils/formatters.js'

export default function ActionLog({ lead }) {
  if (!lead) return null

  const actions = []
  if (lead.reply_sent) actions.push({ label: 'Email sent via SES', time: lead.updated_at, color: '#2dd4bf' })
  if (lead.stripe_link) actions.push({ label: 'Stripe payment link created', time: lead.updated_at, color: '#fbbf24' })
  if (lead.proposal_url) actions.push({ label: 'Proposal PDF presigned URL generated', time: lead.updated_at, color: '#2dd4bf' })
  if (lead.slack_notified) actions.push({ label: 'Slack notification posted', time: lead.updated_at, color: '#2dd4bf' })
  if (lead.followup_sent) actions.push({ label: 'Follow-up email sent', time: lead.updated_at, color: '#f87171' })
  if (lead.escalated) actions.push({ label: 'Escalated via SNS', time: lead.updated_at, color: '#f87171' })

  return (
    <div>
      {actions.map((a, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.color, flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: '#94a3b8', flex: 1 }}>{a.label}</span>
          <span style={{ fontSize: '10px', color: '#64748b' }}>{formatTime(a.time)}</span>
        </div>
      ))}
    </div>
  )
}
