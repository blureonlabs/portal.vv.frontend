import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, ChevronLeft, ChevronRight } from 'lucide-react'
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
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-brand" />
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); handleFilter() }}
          className="w-44"
        >
          <option value="">All entities</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Input
          placeholder="Filter by action…"
          value={action}
          onChange={(e) => { setAction(e.target.value); handleFilter() }}
          className="w-48"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="py-3 px-4 text-left font-medium text-gray-500">Timestamp</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500">Actor Role</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500">Entity</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500">Action</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500">Entity ID</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  <div className="flex justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-brand border-t-transparent rounded-full" />
                  </div>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">No audit entries found</td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="py-2.5 px-4 text-gray-600 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {e.actor_role}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-700 capitalize">{e.entity_type}</td>
                  <td className="py-2.5 px-4">
                    <span className="font-mono text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      {e.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs text-gray-400">
                    {e.entity_id ? e.entity_id.slice(0, 8) + '…' : '—'}
                  </td>
                  <td className="py-2.5 px-4 max-w-xs">
                    {e.metadata ? (
                      <span className="font-mono text-xs text-gray-500 truncate block">
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
        <span className="text-sm text-gray-500">
          Page {page + 1}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={entries.length < PAGE_SIZE}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
