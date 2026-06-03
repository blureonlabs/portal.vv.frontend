interface Tab {
  key: string
  label: string
  count?: number
}

interface TabViewProps {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
}

export function TabView({ tabs, active, onChange }: TabViewProps) {
  return (
    <div className="flex gap-1 bg-surface rounded-full p-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            active === tab.key
              ? 'bg-white text-primary shadow-sm'
              : 'text-muted hover:text-primary'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 text-xs ${active === tab.key ? 'text-muted' : 'text-muted/60'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
