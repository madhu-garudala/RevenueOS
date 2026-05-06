import React, { useState, useEffect, useCallback } from 'react'
import TopBar from './components/TopBar.jsx'
import SubNav from './components/SubNav.jsx'
import MetricCards from './components/MetricCards.jsx'
import LiveFeed from './components/LiveFeed.jsx'
import SlackMonitor from './components/SlackMonitor.jsx'
import VoiceRecorder from './components/VoiceRecorder.jsx'
import Footer from './components/Footer.jsx'
import LeadsPage from './components/LeadsPage.jsx'
import CallIntelligencePage from './components/CallIntelligencePage.jsx'
import AuditLogPage from './components/AuditLogPage.jsx'
import SettingsPage from './components/SettingsPage.jsx'
import { fetchLeads } from './utils/api.js'
import { POLL_INTERVAL_MS } from './config.js'

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [leads, setLeads] = useState([])
  const [metrics, setMetrics] = useState({})

  const loadLeads = useCallback(async () => {
    try {
      const data = await fetchLeads()
      setLeads(data.leads || [])
      setMetrics(data.metrics || {})
    } catch {
      // Silent fail — next poll retries
    }
  }, [])

  useEffect(() => {
    loadLeads()
    const id = setInterval(loadLeads, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [loadLeads])

  function renderPage() {
    switch (activeTab) {
      case 'Leads':
        return <LeadsPage leads={leads} />
      case 'Call Intelligence':
        return <CallIntelligencePage leads={leads} />
      case 'Audit Log':
        return <AuditLogPage leads={leads} />
      case 'Settings':
        return <SettingsPage />
      default:
        return (
          <div style={{ flex: 1, padding: '16px 20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <MetricCards metrics={metrics} />
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px', flex: 1, minHeight: 0 }}>
              <LiveFeed leads={leads} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                <SlackMonitor leads={leads} />
                <VoiceRecorder />
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
      <TopBar />
      <SubNav activeTab={activeTab} onTabChange={setActiveTab} />
      {renderPage()}
      <Footer leads={leads} />
    </div>
  )
}
