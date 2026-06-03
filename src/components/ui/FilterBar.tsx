import { type ReactNode } from 'react'

interface FilterBarProps {
  children: ReactNode
  actions?: ReactNode
}

export function FilterBar({ children, actions }: FilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap items-center gap-3 flex-1">{children}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
