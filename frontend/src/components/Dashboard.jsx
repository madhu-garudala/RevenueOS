import React, { useState, useEffect, useCallback } from 'react'
import TopBar from './TopBar.jsx'
import SubNav from './SubNav.jsx'
import MetricCards from './MetricCards.jsx'
import LiveFeed from './LiveFeed.jsx'
import SlackMonitor from './SlackMonitor.jsx'
import VoiceRecorder from './VoiceRecorder.jsx'
import Footer from './Footer.jsx'
import { fetchLeads } from '../utils/api.js'
import { POLL_INTERVAL_MS } from '../config.js'

export default function Dashboard() {
  const [leads, setLeads] = useState([])
  const [metrics, setMetrics] = useState({})

  const loadLeads = useCallback(async () => {
    try {
      const data = await fetchLeads()
      setLeads(data.leads || [])
      setMetrics(data.metrics || {})
    } catch {
      // Silent fail — next poll will retry
    }
  }, [])

  useEffect(() => {
    loadLeads()
    const id = setInterval(loadLeads, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [loadLeads])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a1628',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <TopBar />
      <SubNav />

      {/* Main content */}
      <div style={{ flex: 1, padding: '16px 20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MetricCards metrics={metrics} />

        {/* Body grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: '12px',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Left: Live Feed */}
          <LiveFeed leads={leads} />

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            <SlackMonitor leads={leads} />
            <VoiceRecorder />
          </div>
        </div>
      </div>

      <Footer leads={leads} />
    </div>
  )
}
