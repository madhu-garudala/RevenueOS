import React, { useState } from 'react'
import { formatRelative, formatTime, statusColor } from '../utils/formatters.js'
import SentimentBadge from './SentimentBadge.jsx'
import UrgencyBadge from './UrgencyBadge.jsx'

const STATUSES = ['ALL', 'NEW', 'ANALYZED', 'EXECUTING', 'COMPLETED', 'FOLLOW_UP_SENT', 'ESCALATED', 'DEAD']

export default function LeadsPage({ leads }) {
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const filtered = leads.filter((l) => {
    const matchStatus = filter === 'ALL' || l.status === filter
    const matchSearch =
      !search ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.company?.toLowerCase().includes(search.toLowerCase()) ||
      l.message?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>All Leads</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{filtered.length} of {leads.length} leads</div>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, company, message…"
          style={{
            background: '#0d1f38', border: '0.5px solid #1e3a5f', borderRadius: '6px',
            padding: '6px 12px', color: '#e2e8f0', fontSize: '12px', width: '240px', outline: 'none',
          }}
        />
      </div>

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              fontSize: '10px', padding: '3px 10px', borderRadius: '99px', cursor: 'pointer',
              border: filter === s ? '1px solid #2dd4bf' : '0.5px solid #1e3a5f',
              background: filter === s ? 'rgba(45,212,191,0.12)' : '#0d1f38',
              color: filter === s ? '#2dd4bf' : '#64748b',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#0d1f38', border: '0.5px solid #1e3a5f', borderRadius: '10px', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr',
          padding: '8px 14px', borderBottom: '0.5px solid #1e3a5f',
          fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>
          <div>Contact</div>
          <div>Message</div>
          <div>Intent</div>
          <div>Urgency</div>
          <div>Sentiment</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
            No leads match this filter
          </div>
        ) : (
          filtered.map((lead, i) => (
            <div
              key={lead.leadId}
              style={{
                display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr',
                padding: '10px 14px', borderBottom: i < filtered.length - 1 ? '0.5px solid #1e3a5f' : 'none',
                background: i % 2 === 0 ? '#0d1f38' : '#0a1a2e',
                alignItems: 'center',
              }}
            >
              {/* Contact */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#e2e8f0' }}>{lead.company || '—'}</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>{lead.name} · {lead.channel}</div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '1px' }}>{formatRelative(lead.created_at)}</div>
              </div>

              {/* Message */}
              <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.4, paddingRight: '8px' }}>
                {lead.message?.slice(0, 80)}{lead.message?.length > 80 ? '…' : ''}
              </div>

              {/* Intent */}
              <div style={{ fontSize: '10px', color: '#2dd4bf' }}>
                {lead.intent?.replace(/_/g, ' ') || '—'}
              </div>

              {/* Urgency */}
              <div>{lead.urgency ? <UrgencyBadge urgency={lead.urgency} /> : '—'}</div>

              {/* Sentiment */}
              <div>{lead.sentiment ? <SentimentBadge sentiment={lead.sentiment} /> : '—'}</div>

              {/* Status */}
              <div>
                <span style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '3px',
                  background: `${statusColor(lead.status)}18`, color: statusColor(lead.status),
                }}>
                  {lead.status}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {lead.reply_sent && <span style={{ fontSize: '9px', color: '#2dd4bf' }}>✉</span>}
                {lead.stripe_link && (
                  <a href={lead.stripe_link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '9px', color: '#fbbf24', textDecoration: 'none' }}>💳</a>
                )}
                {lead.proposal_url && (
                  <a href={lead.proposal_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '9px', color: '#2dd4bf', textDecoration: 'none' }}>📄</a>
                )}
                {lead.slack_notified && <span style={{ fontSize: '9px', color: '#2dd4bf' }}>#</span>}
                {lead.followup_sent && <span style={{ fontSize: '9px', color: '#f87171' }}>↩</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
