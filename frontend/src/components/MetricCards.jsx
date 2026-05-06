import React, { useRef, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { formatCurrency } from '../utils/formatters.js'

function MetricCard({ label, value, accent, displayValue, trend }) {
  const controls = useAnimation()
  const prevValue = useRef(value)

  useEffect(() => {
    if (prevValue.current !== value && prevValue.current !== undefined) {
      controls.start({
        scale: [1, 1.12, 1],
        transition: { duration: 0.3 },
      })
    }
    prevValue.current = value
  }, [value, controls])

  return (
    <div
      style={{
        background: '#0d1f38',
        border: '0.5px solid #1e3a5f',
        borderLeft: `2px solid ${accent}`,
        borderRadius: '0 8px 8px 0',
        padding: '12px 14px',
      }}
    >
      <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
        {label}
      </div>
      <motion.div animate={controls} style={{ display: 'inline-block' }}>
        <div style={{ fontSize: '22px', fontWeight: 500, color: '#e2e8f0', lineHeight: 1 }}>
          {displayValue}
        </div>
      </motion.div>
      {trend && (
        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{trend}</div>
      )}
    </div>
  )
}

export default function MetricCards({ metrics }) {
  const m = metrics || {}

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        marginBottom: '16px',
      }}
    >
      <MetricCard
        label="Leads Today"
        value={m.total_today || 0}
        displayValue={m.total_today || 0}
        accent="#2dd4bf"
        trend="All channels"
      />
      <MetricCard
        label="High Risk"
        value={m.high_risk_count || 0}
        displayValue={m.high_risk_count || 0}
        accent="#f87171"
        trend="Needs attention"
      />
      <MetricCard
        label="Actions Executed"
        value={m.actions_executed || 0}
        displayValue={m.actions_executed || 0}
        accent="#2dd4bf"
        trend="By autonomous agent"
      />
      <MetricCard
        label="Est. Revenue Recovered"
        value={m.estimated_revenue || 0}
        displayValue={formatCurrency(m.estimated_revenue || 0)}
        accent="#fbbf24"
        trend={`${m.actions_executed || 0} deals × $999`}
      />
    </div>
  )
}
