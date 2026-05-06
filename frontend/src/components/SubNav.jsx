import React from 'react'

const NAV_ITEMS = ['Dashboard', 'Leads', 'Call Intelligence', 'Audit Log', 'Settings']

export default function SubNav({ activeTab, onTabChange }) {
  return (
    <div
      style={{
        background: '#060e1d',
        borderBottom: '0.5px solid #1e3a5f',
        display: 'flex',
        alignItems: 'center',
        padding: '0 6px',
        flexShrink: 0,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = item === activeTab
        return (
          <div
            key={item}
            onClick={() => onTabChange(item)}
            style={{
              fontSize: '12px',
              padding: '10px 14px',
              color: active ? '#2dd4bf' : '#64748b',
              borderBottom: active ? '2px solid #2dd4bf' : '2px solid transparent',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'color 0.15s',
            }}
          >
            {item}
          </div>
        )
      })}
    </div>
  )
}
