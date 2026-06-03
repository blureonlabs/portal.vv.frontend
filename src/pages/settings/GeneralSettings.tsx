import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPut } from '../../lib/api'
import { Input } from '../../components/ui/Input'
import { useAuthStore } from '../../store/authStore'
import type { Setting } from '../../types'
import { Check, Pencil, X } from 'lucide-react'
import { useToast } from '../../components/ui/Toast'

const GROUPS: { key: string; title: string; description: string; icon: string; keys: string[]; adminOnly: boolean }[] = [
  {
    key: 'company',
    title: 'Company Information',
    description: 'Business name and address shown on invoices and salary slips',
    icon: 'building',
    keys: ['company_name', 'company_address'],
    adminOnly: true,
  },
  {
    key: 'salary',
    title: 'Salary Parameters',
    description: 'Base amounts and rates used in salary calculations',
    icon: 'wallet',
    keys: ['commission_rate', 'salary_target_high_aed', 'salary_fixed_car_high_aed', 'salary_target_low_aed', 'salary_fixed_car_low_aed'],
    adminOnly: false,
  },
  {
    key: 'operations',
    title: 'Operations',
    description: 'Trip limits, pay cycle, and automation settings',
    icon: 'settings',
    keys: ['trip_cap_aed', 'salary_auto_generate_day', 'salary_auto_generate_enabled'],
    adminOnly: true,
  },
]

const KEY_LABELS: Record<string, string> = {
  company_name: 'Company Name',
  company_address: 'Company Address',
  commission_rate: 'Commission Rate (decimal, e.g. 0.30 = 30%)',
  trip_cap_aed: 'Daily Trip Cap (AED)',
  salary_target_high_aed: 'Salary Target — High (AED)',
  salary_fixed_car_high_aed: 'Fixed Car Allowance — High (AED)',
  salary_target_low_aed: 'Salary Target — Low (AED)',
  salary_fixed_car_low_aed: 'Fixed Car Allowance — Low (AED)',
  salary_auto_generate_day: 'Auto-Generate Salary Day (1-28)',
  salary_auto_generate_enabled: 'Auto-Generate Salary Enabled (true/false)',
}

function formatKey(key: string) {
  return KEY_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function groupSettings(settings: Setting[], isSuperAdmin: boolean) {
  return GROUPS
    .filter(g => isSuperAdmin || !g.adminOnly)
    .map(g => ({
      ...g,
      settings: g.keys
        .map(k => settings.find(s => s.key === k))
        .filter((s): s is Setting => s != null),
    }))
    .filter(g => g.settings.length > 0)
}

function SettingsSection({ title, description, settings, canEdit }: { title: string; description?: string; settings: Setting[]; canEdit: boolean }) {
  if (settings.length === 0) return null
  return (
    <div className="bg-white rounded-2xl border border-border overflow-x-auto">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
      <table className="w-full">
        <tbody>
          {settings.map((s) => (
            <tr key={s.key} className="group border-b border-border last:border-0">
              <td className="py-3 px-4 text-sm font-medium text-primary w-48 min-w-[120px]">{formatKey(s.key)}</td>
              <td className="py-3 px-4">
                <EditRowInner setting={s} canEdit={canEdit} />
              </td>
              <td className="py-3 px-4 text-xs text-muted">
                {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : '\u2014'}
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
  const [error, setError] = useState('')

  const toast = useToast()
  const { mutate, isPending } = useMutation({
    mutationFn: () => apiPut(`/settings/${setting.key}`, { value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      setEditing(false)
      setError('')
      toast.add('Setting updated', 'success')
    },
    onError: (e) => { const msg = e instanceof Error ? e.message : 'Failed to save'; setError(msg); toast.add(msg, 'error') },
  })

  if (!canEdit) return <span className="text-sm text-primary">{setting.value || '\u2014'}</span>

  return editing ? (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 text-sm w-full max-w-full sm:max-w-[256px]"
          autoFocus
        />
        <button
          onClick={() => mutate()}
          disabled={isPending}
          aria-label="Save"
          className="p-1.5 text-green-600 hover:bg-green-50 rounded inline-flex items-center gap-1"
        >
          {isPending ? (
            <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full" />
          ) : (
            <Check size={16} />
          )}
          <span className="text-xs">Save</span>
        </button>
        <button
          onClick={() => { setEditing(false); setValue(setting.value); setError('') }}
          aria-label="Cancel"
          className="p-1.5 text-muted hover:bg-surface rounded"
        >
          <X size={16} />
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <span className="text-sm text-primary">{setting.value || '\u2014'}</span>
      <button
        onClick={() => { setValue(setting.value); setEditing(true) }}
        aria-label="Edit"
        className="p-1 text-muted hover:text-primary rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil size={14} />
      </button>
    </div>
  )
}

export default function GeneralSettings() {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'super_admin'

  const { data: settings = [], isLoading } = useQuery<Setting[]>({
    queryKey: ['settings'],
    queryFn: () => apiGet('/settings'),
  })

  const groups = groupSettings(settings, isSuperAdmin)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map(g => (
        <SettingsSection key={g.key} title={g.title} description={g.description} settings={g.settings} canEdit={true} />
      ))}
    </div>
  )
}
