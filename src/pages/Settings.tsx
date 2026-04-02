import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings2, Pencil, Check, X } from 'lucide-react'
import { apiGet, apiPut } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import type { Setting } from '../types'

const ACCOUNTANT_KEYS = new Set([
  'salary_target_high_aed',
  'salary_fixed_car_high_aed',
  'salary_target_low_aed',
  'salary_fixed_car_low_aed',
])

const KEY_LABELS: Record<string, string> = {
  company_name: 'Company Name',
  company_address: 'Company Address',
  trip_cap_aed: 'Trip Cap (AED)',
  salary_target_high_aed: 'Salary Target — High (AED)',
  salary_fixed_car_high_aed: 'Fixed Car Allowance — High (AED)',
  salary_target_low_aed: 'Salary Target — Low (AED)',
  salary_fixed_car_low_aed: 'Fixed Car Allowance — Low (AED)',
}

function formatKey(key: string) {
  return KEY_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function groupSettings(settings: Setting[], isSuperAdmin: boolean) {
  const salary = settings.filter((s) => ACCOUNTANT_KEYS.has(s.key))
  const other = isSuperAdmin ? settings.filter((s) => !ACCOUNTANT_KEYS.has(s.key)) : []
  return { salary, other }
}

interface EditRowProps {
  setting: Setting
  canEdit: boolean
}

function EditRow({ setting, canEdit }: EditRowProps) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(setting.value)

  const { mutate, isPending } = useMutation({
    mutationFn: () => apiPut(`/settings/${setting.key}`, { value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      setEditing(false)
    },
  })

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 px-4 text-sm font-medium text-gray-700 w-64">{formatKey(setting.key)}</td>
      <td className="py-3 px-4">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 text-sm w-64"
              autoFocus
            />
            <button
              onClick={() => mutate()}
              disabled={isPending}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setEditing(false); setValue(setting.value) }}
              className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-900">{setting.value || '—'}</span>
            {canEdit && (
              <button
                onClick={() => { setValue(setting.value); setEditing(true) }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </td>
      <td className="py-3 px-4 text-xs text-gray-400">
        {setting.updated_at ? new Date(setting.updated_at).toLocaleDateString() : '—'}
      </td>
    </tr>
  )
}

function SettingsSection({ title, settings, canEdit }: { title: string; settings: Setting[]; canEdit: boolean }) {
  if (settings.length === 0) return null
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <table className="w-full">
        <tbody>
          {settings.map((s) => (
            <tr key={s.key} className="group border-b border-border last:border-0">
              <td className="py-3 px-4 text-sm font-medium text-gray-700 w-64">{formatKey(s.key)}</td>
              <td className="py-3 px-4">
                <EditRowInner setting={s} canEdit={canEdit} />
              </td>
              <td className="py-3 px-4 text-xs text-gray-400">
                {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EditRowInner({ setting, canEdit }: { setting: Setting; canEdit: boolean }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(setting.value)

  const { mutate, isPending } = useMutation({
    mutationFn: () => apiPut(`/settings/${setting.key}`, { value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      setEditing(false)
    },
  })

  if (!canEdit) return <span className="text-sm text-gray-900">{setting.value || '—'}</span>

  return editing ? (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 text-sm w-64"
        autoFocus
      />
      <button
        onClick={() => mutate()}
        disabled={isPending}
        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={() => { setEditing(false); setValue(setting.value) }}
        className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-900">{setting.value || '—'}</span>
      <button
        onClick={() => { setValue(setting.value); setEditing(true) }}
        className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function Settings() {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'super_admin'

  const { data: settings = [], isLoading } = useQuery<Setting[]>({
    queryKey: ['settings'],
    queryFn: () => apiGet('/settings'),
  })

  const { salary, other } = groupSettings(settings, isSuperAdmin)

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-48">
        <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings2 className="w-6 h-6 text-brand" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="space-y-4">
        {isSuperAdmin && other.length > 0 && (
          <SettingsSection title="General" settings={other} canEdit={true} />
        )}
        <SettingsSection title="Salary Parameters" settings={salary} canEdit={true} />
      </div>
    </div>
  )
}
