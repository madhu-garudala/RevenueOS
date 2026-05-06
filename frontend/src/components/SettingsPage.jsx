import React from 'react'

function Row({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '0.5px solid #1e3a5f' }}>
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: '12px', color: accent || '#2dd4bf', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#0d1f38', border: '0.5px solid #1e3a5f', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ padding: '8px 14px', borderBottom: '0.5px solid #1e3a5f', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div style={{ padding: '16px 20px', maxWidth: '680px' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>Settings</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>RevenueOS configuration</div>
      </div>

      <Section title="AWS Infrastructure">
        <Row label="Region" value="us-east-1" />
        <Row label="DynamoDB Table" value="RevenueOSLeads" />
        <Row label="S3 Proposals Bucket" value="revenueos-proposals" />
        <Row label="Step Functions" value="RevenueOSWorkflow" />
        <Row label="SNS Escalation Topic" value="revenueos-escalation" />
      </Section>

      <Section title="AI Configuration">
        <Row label="Bedrock Model" value="claude-sonnet-4-6" />
        <Row label="Intent Analysis" value="Enabled" />
        <Row label="Email Drafting" value="Enabled" />
        <Row label="Voice Transcription" value="AWS Transcribe · en-US" />
      </Section>

      <Section title="Integrations">
        <Row label="Slack Inbound" value="Event Subscriptions · Active" />
        <Row label="Slack Outbound" value="#revenue-alerts · Webhook" />
        <Row label="Email (SES)" value="Configured via SAM parameter" />
        <Row label="Stripe" value="Test Mode · Active" />
      </Section>

      <Section title="Follow-up Automation">
        <Row label="Follow-up Delay (Demo)" value="2 minutes" accent="#fbbf24" />
        <Row label="Follow-up Delay (Production)" value="48 hours" accent="#64748b" />
        <Row label="Scheduler" value="EventBridge Scheduler" />
        <Row label="Max Follow-ups" value="2 per lead" />
      </Section>
    </div>
  )
}
