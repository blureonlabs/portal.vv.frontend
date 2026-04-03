export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-border/50 rounded-xl ${className ?? ''}`} />
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
      ))}
    </tr>
  )
}
