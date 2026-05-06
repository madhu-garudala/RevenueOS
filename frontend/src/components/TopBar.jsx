import React, { useState, useEffect } from 'react'

export default function TopBar() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <div
      style={{
        background: '#060e1d',
        borderBottom: '0.5px solid #1e3a5f',
        height: '52px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '7px',
            border: '1px solid #2dd4bf',
            background: 'linear-gradient(135deg, #0d3d3d, rgba(45,212,191,0.13))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <polyline
              points="1,11 5,7 9,9 15,3"
              stroke="#2dd4bf"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="11,3 15,3 15,7"
              stroke="#2dd4bf"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#e2e8f0' }}>RevenueOS</span>
          <span style={{ fontSize: '9px', color: '#2dd4bf', letterSpacing: '0.12em' }}>
            AUTONOMOUS REVENUE INTELLIGENCE
          </span>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Live pill */}
        <div
          style={{
            background: 'rgba(45,212,191,0.08)',
            border: '0.5px solid rgba(45,212,191,0.2)',
            borderRadius: '99px',
            padding: '3px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <div
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#2dd4bf',
            }}
          />
          <span style={{ fontSize: '10px', color: '#2dd4bf', fontWeight: 500 }}>LIVE</span>
        </div>

        {/* Clock */}
        <span style={{ fontSize: '11px', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
          {timeStr}
        </span>

        {/* Avatar */}
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0d3d3d, #0d1f38)',
            border: '0.5px solid #2dd4bf',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: '#2dd4bf', fontWeight: 600 }}>M</span>
        </div>
      </div>
    </div>
  )
}
