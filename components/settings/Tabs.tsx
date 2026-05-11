// components/settings/Tabs.tsx
export interface Tab {
  key: string
  label: string
  icon: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (key: string) => void
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #ebebeb', marginBottom: '1.5rem' }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontWeight: 600,
            color: activeTab === tab.key ? '#111' : '#888',
            borderBottom: activeTab === tab.key ? '2px solid #0a6ed1' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          <i className={tab.icon} style={{ marginRight: '0.5rem' }} />
          {tab.label}
        </button>
      ))}
    </div>
  )
}