import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={48} className="text-muted/40 mb-3" />
      <p className="text-sm font-medium text-primary mb-1">{title}</p>
      {description && <p className="text-xs text-muted mb-4">{description}</p>}
      {action}
    </div>
  )
}
