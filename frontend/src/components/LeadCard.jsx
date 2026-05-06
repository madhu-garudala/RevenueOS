import React from 'react'
import { motion } from 'framer-motion'
import SentimentBadge from './SentimentBadge.jsx'
import UrgencyBadge from './UrgencyBadge.jsx'
import { formatRelative } from '../utils/formatters.js'

const STATUS_STYLE = {
  NEW:             { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  ANALYZED:        { bg: 'rgba(59,130,246,0.10)',  color: '#60a5fa' },
  EXECUTING:       { bg: 'rgba(251,191,36,0.10)',  color: '#fbbf24' },
  COMPLETED:       { bg: 'rgba(45,212,191,0.10)',  color: '#2dd4bf' },
  FOLLOW_UP_SENT:  { bg: 'rgba(248,113,113,0.10)', color: '#f87171' },
  DEAD:            { bg: 'rgba(100,116,139,0.10)', color: '#64748b' },
  FAILED:          { bg: 'rgba(248,113,113,0.10)', color: '#f87171' },
  ESCALATED:       { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
}

function borderAccent(lead) {
  if (lead.status === 'COMPLETED') return '#2dd4bf'
  if (lead.status === 'FOLLOW_UP_SENT' || lead.revenue_risk === 'high') return '#f87171'
  return '#64748b'
}

export default function LeadCard({ lead }) {
  const st = STATUS_STYLE[lead.status] || STATUS_STYLE.NEW
  const showActions = ['COMPLETED', 'FOLLOW_UP_SENT', 'ESCALATED'].includes(lead.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: '#102236',
        border: '0.5px solid #1e3a5f',
        borderLeft: `2px solid ${borderAccent(lead)}`,
        borderRadius: '0 8px 8px 0',
        padding: '10px 12px',
        marginBottom: '8px',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>
            {lead.company || 'Unknown Company'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
            {lead.name} · {lead.channel}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '3px',
              background: st.bg,
              color: st.color,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {lead.status}
          </span>
          <span style={{ fontSize: '10px', color: '#64748b' }}>
            {formatRelative(lead.created_at)}
          </span>
        </div>
      </div>

      {/* Message snippet */}
      {lead.message && (
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', lineHeight: 1.5 }}>
          {lead.message.length > 120 ? lead.message.slice(0, 120) + '…' : lead.message}
        </div>
      )}

      {/* Badges */}
      {(lead.intent || lead.urgency || lead.sentiment || lead.revenue_risk) && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
          {lead.intent && (
            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: 'rgba(45,212,191,0.08)', color: '#2dd4bf' }}>
              {lead.intent.replace(/_/g, ' ')}
            </span>
          )}
          {lead.urgency && <UrgencyBadge urgency={lead.urgency} />}
          {lead.sentiment && <SentimentBadge sentiment={lead.sentiment} />}
          {lead.revenue_risk && (
            <span style={{
              fontSize: '10px', padding: '2px 7px', borderRadius: '3px',
              background: lead.revenue_risk === 'high' ? 'rgba(248,113,113,0.10)' : 'rgba(100,116,139,0.10)',
              color: lead.revenue_risk === 'high' ? '#f87171' : '#64748b',
            }}>
              risk:{lead.revenue_risk}
            </span>
          )}
        </div>
      )}

      {/* Action chips */}
      {showActions && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {lead.reply_sent && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: 'rgba(45,212,191,0.07)', color: '#2dd4bf', border: '0.5px solid rgba(45,212,191,0.18)' }}>
              ✉ Email sent
            </span>
          )}
          {lead.slack_notified && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: 'rgba(45,212,191,0.07)', color: '#2dd4bf', border: '0.5px solid rgba(45,212,191,0.18)' }}>
              # Slack notified
            </span>
          )}
          {lead.stripe_link && (
            <a
              href={lead.stripe_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: 'rgba(251,191,36,0.06)', color: '#fbbf24', border: '0.5px solid rgba(251,191,36,0.20)' }}
            >
              💳 Stripe link ↗
            </a>
          )}
          {lead.proposal_url && (
            <a
              href={lead.proposal_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: 'rgba(45,212,191,0.07)', color: '#2dd4bf', border: '0.5px solid rgba(45,212,191,0.18)' }}
            >
              📄 Proposal PDF ↗
            </a>
          )}
          {lead.status === 'ESCALATED' && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: 'rgba(248,113,113,0.06)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.20)' }}>
              ⚠ Escalated
            </span>
          )}
        </div>
      )}

      {/* Voice transcript summary */}
      {lead.channel === 'voice' && lead.call_action_items && lead.call_action_items.length > 0 && (
        <div style={{ marginTop: '6px', fontSize: '10px', color: '#64748b' }}>
          Action items: {lead.call_action_items.slice(0, 2).join(' · ')}
        </div>
      )}
    </motion.div>
  )
}
