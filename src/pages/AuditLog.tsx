import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import type { AuditEntry } from '../types'

const PAGE_SIZE = 50

const ENTITY_TYPES = ['driver', 'vehicle', 'trip', 'advance', 'hr', 'invoice', 'salary', 'auth']

export default function AuditLog() {
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(0)

  const params = new URLSearchParams()
  if (entityType) params.set('entity_type', entityType)
  if (action) params.set('action', action)
  params.set('limit', String(PAGE_SIZE))
  params.set('offset', String(page * PAGE_SIZE))

  const { data: entries = [], isLoading } = useQuery<AuditEntry[]>({
    queryKey: ['audit', entityType, action, page],
    queryFn: () => apiGet(`/audit?${params.toString()}`),
  })

  const handleFilter = () => setPage(0)

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <span className="material-symbols-rounded text-[24px] text-primary">shield</span>
        <h1 className="text-2xl font-bold text-primary">Audit Log</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); handleFilter() }}
          className="w-44"
          options={[
            { value: '', label: 'All entities' },
            ...ENTITY_TYPES.map((t) => ({ value: t, label: t })),
          ]}
        />
        <Input
          placeholder="Filter by action…"
          value={action}
          onChange={(e) => { setAction(e.target.value); handleFilter() }}
          className="w-48"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="py-3 px-4 text-left font-medium text-muted">Timestamp</th>
              <th className="py-3 px-4 text-left font-medium text-muted">Actor Role</th>
              <th className="py-3 px-4 text-left font-medium text-muted">Entity</th>
              <th className="py-3 px-4 text-left font-medium text-muted">Action</th>
              <th className="py-3 px-4 text-left font-medium text-muted">Entity ID</th>
              <th className="py-3 px-4 text-left font-medium text-muted">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">
                  <div className="flex justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">No audit entries found</td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="py-2.5 px-4 text-muted whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface text-primary">
                      {e.actor_role}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-primary capitalize">{e.entity_type}</td>
                  <td className="py-2.5 px-4">
                    <span className="font-mono text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      {e.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs text-muted">
                    {e.entity_id ? e.entity_id.slice(0, 8) + '…' : '—'}
                  </td>
                  <td className="py-2.5 px-4 max-w-xs">
                    {e.metadata ? (
                      <span className="font-mono text-xs text-muted truncate block">
                        {JSON.stringify(e.metadata)}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          Page {page + 1}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <span className="material-symbols-rounded text-[16px]">chevron_left</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={entries.length < PAGE_SIZE}
          >
            <span className="material-symbols-rounded text-[16px]">chevron_right</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
