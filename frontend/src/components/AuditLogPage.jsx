import React from 'react'
import { formatTime, formatRelative, statusColor } from '../utils/formatters.js'

function buildEvents(lead) {
  const events = []
  const t = (ts) => ts || lead.created_at

  events.push({ time: lead.created_at, color: '#64748b', icon: '⬤', label: 'Lead created', detail: `Channel: ${lead.channel}` })

  if (lead.intent) events.push({ time: lead.updated_at, color: '#60a5fa', icon: '🧠', label: 'Intent analysed by Bedrock', detail: `${lead.intent} · ${lead.urgency} urgency · ${lead.sentiment} sentiment` })

  if (lead.status === 'EXECUTING' || lead.status === 'COMPLETED') events.push({ time: lead.updated_at, color: '#fbbf24', icon: '⚡', label: 'Step Functions workflow started', detail: 'Parallel branches: email + payment + proposal' })

  if (lead.reply_sent) events.push({ time: lead.updated_at, color: '#2dd4bf', icon: '✉', label: 'Personalised email sent via SES', detail: 'via Amazon SES' })

  if (lead.stripe_link) events.push({ time: lead.updated_at, color: '#fbbf24', icon: '💳', label: 'Stripe payment link created', detail: lead.stripe_link.slice(0, 48) + '…' })

  if (lead.proposal_url) events.push({ time: lead.updated_at, color: '#2dd4bf', icon: '📄', label: 'Proposal PDF presigned URL generated', detail: 'S3: revenueos-proposals' })

  if (lead.slack_notified) events.push({ time: lead.updated_at, color: '#2dd4bf', icon: '#', label: 'Slack notification posted', detail: '#revenue-alerts' })

  if (lead.followup_scheduled) events.push({ time: lead.updated_at, color: '#94a3b8', icon: '⏱', label: 'Follow-up scheduled', detail: 'EventBridge Scheduler · 2 min' })

  if (lead.followup_sent) events.push({ time: lead.updated_at, color: '#f87171', icon: '↩', label: 'Follow-up email sent', detail: 'Different angle · Bedrock-drafted' })

  if (lead.escalated) events.push({ time: lead.updated_at, color: '#f87171', icon: '⚠', label: 'Escalated via SNS', detail: 'Human intervention required' })

  if (lead.status === 'COMPLETED') events.push({ time: lead.updated_at, color: '#2dd4bf', icon: '✓', label: 'Workflow completed', detail: 'All actions executed autonomously' })

  return events
}

export default function AuditLogPage({ leads }) {
  const completedLeads = leads.filter((l) => ['COMPLETED', 'FOLLOW_UP_SENT', 'ESCALATED'].includes(l.status))

  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>Audit Log</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Every autonomous action taken by RevenueOS</div>
      </div>

      {completedLeads.length === 0 ? (
        <div style={{ background: '#0d1f38', border: '0.5px solid #1e3a5f', borderRadius: '10px', padding: '40px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
          No completed leads yet
        </div>
      ) : (
        completedLeads.map((lead) => (
          <div key={lead.leadId} style={{ background: '#0d1f38', border: '0.5px solid #1e3a5f', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
            {/* Lead header */}
            <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #1e3a5f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>{lead.company}</span>
                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>{lead.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: `${statusColor(lead.status)}18`, color: statusColor(lead.status) }}>
                  {lead.status}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>{formatRelative(lead.created_at)}</span>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ padding: '12px 14px' }}>
              {buildEvents(lead).map((ev, i, arr) => (
                <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: i < arr.length - 1 ? '10px' : '0' }}>
                  {/* Timeline line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
                    {i < arr.length - 1 && <div style={{ width: '1px', flex: 1, background: '#1e3a5f', marginTop: '2px' }} />}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#e2e8f0' }}>{ev.label}</span>
                      <span style={{ fontSize: '9px', color: '#64748b' }}>{formatTime(ev.time)}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>{ev.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
