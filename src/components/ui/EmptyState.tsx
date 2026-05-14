interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="material-symbols-rounded text-[48px] text-muted/40 mb-3">{icon}</span>
      <p className="text-sm font-medium text-primary mb-1">{title}</p>
      {description && <p className="text-xs text-muted mb-4">{description}</p>}
      {action}
    </div>
  )
}
