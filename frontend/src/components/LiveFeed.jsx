import React, { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import LeadCard from './LeadCard.jsx'

export default function LiveFeed({ leads }) {
  const prevLeadsRef = useRef([])
  const containerRef = useRef(null)

  useEffect(() => {
    const prevIds = new Set(prevLeadsRef.current.map((l) => l.leadId))
    const hasNew = leads.some((l) => !prevIds.has(l.leadId))
    if (hasNew && containerRef.current) {
      containerRef.current.scrollTop = 0
    }
    prevLeadsRef.current = leads
  }, [leads])

  return (
    <div
      style={{
        background: '#0d1f38',
        border: '0.5px solid #1e3a5f',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
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
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Live Revenue Activity
        </span>
        <span
          style={{
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '99px',
            background: 'rgba(45,212,191,0.08)',
            border: '0.5px solid rgba(45,212,191,0.2)',
            color: '#2dd4bf',
          }}
        >
          {leads.length}
        </span>
      </div>

      {/* Body */}
      <div
        ref={containerRef}
        style={{
          padding: '10px',
          maxHeight: '520px',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {leads.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '40px 0' }}>
            Waiting for incoming leads…
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {leads.map((lead) => (
              <LeadCard key={lead.leadId} lead={lead} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
