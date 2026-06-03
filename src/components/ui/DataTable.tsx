import { type ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'
import { FileX } from 'lucide-react'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
  rowKey: (row: T) => string
  footer?: ReactNode
}

export function DataTable<T>({ columns, data, isLoading, emptyIcon, emptyTitle, emptyDescription, onRowClick, rowKey, footer }: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="animate-pulse p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return <EmptyState icon={emptyIcon ?? FileX} title={emptyTitle ?? 'No data found'} description={emptyDescription} />
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3 px-4 font-medium text-muted whitespace-nowrap ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                } ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-border last:border-0 transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-surface' : ''
              } ${i % 2 === 1 ? 'bg-surface/30' : ''}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-3 px-4 ${
                    col.align === 'right' ? 'text-right tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.className ?? ''}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  )
}
