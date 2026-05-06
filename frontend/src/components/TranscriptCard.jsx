import React from 'react'

export default function TranscriptCard({ transcript, analysis }) {
  if (!transcript && !analysis) return null

  const sentiment = analysis?.sentiment || 'neutral'
  const dealStage = analysis?.deal_stage || '—'
  const dealRisk = analysis?.deal_risk || '—'

  const sentimentColor = sentiment === 'positive' ? '#2dd4bf' : sentiment === 'negative' ? '#f87171' : '#94a3b8'
  const riskColor = dealRisk === 'high' ? '#f87171' : dealRisk === 'low' ? '#2dd4bf' : '#fbbf24'

  return (
    <div style={{ marginTop: '10px' }}>
      {/* Transcript box */}
      {transcript && (
        <div
          style={{
            background: '#060e1d',
            border: '0.5px solid #1e3a5f',
            borderRadius: '6px',
            padding: '8px 10px',
            marginBottom: '8px',
          }}
        >
          <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            Last Transcript
          </div>
          <div style={{ fontSize: '11px', color: '#2dd4bf', fontFamily: 'monospace', lineHeight: 1.6, maxHeight: '80px', overflowY: 'auto' }}>
            {transcript}
          </div>
        </div>
      )}

      {/* Analysis chips */}
      {analysis && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ flex: 1, background: `rgba(${sentiment === 'positive' ? '45,212,191' : sentiment === 'negative' ? '248,113,113' : '100,116,139'},0.08)`, border: `0.5px solid ${sentimentColor}33`, borderRadius: '5px', padding: '5px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>Sentiment</div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: sentimentColor }}>{sentiment}</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(45,212,191,0.05)', border: '0.5px solid #2dd4bf33', borderRadius: '5px', padding: '5px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>Deal Stage</div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#60a5fa' }}>{dealStage}</div>
          </div>
          <div style={{ flex: 1, background: `rgba(${dealRisk === 'high' ? '248,113,113' : dealRisk === 'low' ? '45,212,191' : '251,191,36'},0.08)`, border: `0.5px solid ${riskColor}33`, borderRadius: '5px', padding: '5px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>Deal Risk</div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: riskColor }}>{dealRisk}</div>
          </div>
        </div>
      )}

      {/* Action items */}
      {analysis?.action_items && analysis.action_items.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            Action Items
          </div>
          {analysis.action_items.map((item, i) => (
            <div key={i} style={{ fontSize: '10px', color: '#94a3b8', padding: '2px 0', display: 'flex', gap: '5px' }}>
              <span style={{ color: '#2dd4bf' }}>›</span> {item}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
