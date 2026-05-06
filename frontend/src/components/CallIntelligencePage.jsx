import React, { useState } from 'react'
import { formatRelative } from '../utils/formatters.js'
import VoiceRecorder from './VoiceRecorder.jsx'

export default function CallIntelligencePage({ leads }) {
  const [selected, setSelected] = useState(null)

  const voiceLeads = leads.filter((l) => l.channel === 'voice')

  const RISK_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#2dd4bf' }
  const SENTIMENT_COLOR = { positive: '#2dd4bf', neutral: '#94a3b8', negative: '#f87171' }

  return (
    <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '16px' }}>
      {/* Left: recorder + call list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <VoiceRecorder />

        {/* Past calls */}
        <div style={{ background: '#0d1f38', border: '0.5px solid #1e3a5f', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #1e3a5f', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Past Calls ({voiceLeads.length})
          </div>
          {voiceLeads.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
              No voice calls yet — record one above
            </div>
          ) : (
            voiceLeads.map((lead) => (
              <div
                key={lead.leadId}
                onClick={() => setSelected(lead)}
                style={{
                  padding: '10px 14px', borderBottom: '0.5px solid #1e3a5f', cursor: 'pointer',
                  background: selected?.leadId === lead.leadId ? 'rgba(45,212,191,0.06)' : 'transparent',
                  borderLeft: selected?.leadId === lead.leadId ? '2px solid #2dd4bf' : '2px solid transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#e2e8f0' }}>{lead.company || 'Voice Call'}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{formatRelative(lead.created_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  {lead.call_sentiment && (
                    <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', background: `${SENTIMENT_COLOR[lead.call_sentiment] || '#94a3b8'}18`, color: SENTIMENT_COLOR[lead.call_sentiment] || '#94a3b8' }}>
                      {lead.call_sentiment}
                    </span>
                  )}
                  {lead.call_deal_stage && (
                    <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
                      {lead.call_deal_stage}
                    </span>
                  )}
                  {lead.call_deal_risk && (
                    <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', background: `${RISK_COLOR[lead.call_deal_risk] || '#94a3b8'}18`, color: RISK_COLOR[lead.call_deal_risk] || '#94a3b8' }}>
                      risk: {lead.call_deal_risk}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: selected call detail */}
      <div>
        {!selected ? (
          <div style={{ background: '#0d1f38', border: '0.5px solid #1e3a5f', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Select a call to view full analysis</div>
          </div>
        ) : (
          <div style={{ background: '#0d1f38', border: '0.5px solid #1e3a5f', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #1e3a5f', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#e2e8f0' }}>{selected.company || 'Voice Call'}</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>{formatRelative(selected.created_at)}</span>
            </div>

            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Transcript */}
              {selected.transcript && (
                <div>
                  <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Transcript</div>
                  <div style={{ background: '#060e1d', border: '0.5px solid #1e3a5f', borderRadius: '6px', padding: '10px', fontSize: '11px', color: '#2dd4bf', fontFamily: 'monospace', lineHeight: 1.6, maxHeight: '120px', overflowY: 'auto' }}>
                    {selected.transcript}
                  </div>
                </div>
              )}

              {/* Summary */}
              {selected.call_summary && (
                <div>
                  <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>AI Summary</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.6 }}>{selected.call_summary}</div>
                </div>
              )}

              {/* Action items */}
              {selected.call_action_items?.length > 0 && (
                <div>
                  <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Action Items</div>
                  {selected.call_action_items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px', fontSize: '11px', color: '#e2e8f0', padding: '3px 0' }}>
                      <span style={{ color: '#2dd4bf' }}>›</span> {item}
                    </div>
                  ))}
                </div>
              )}

              {/* Key topics */}
              {selected.call_key_topics?.length > 0 && (
                <div>
                  <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Key Topics</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selected.call_key_topics.map((t, i) => (
                      <span key={i} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: 'rgba(45,212,191,0.08)', color: '#2dd4bf', border: '0.5px solid rgba(45,212,191,0.2)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
