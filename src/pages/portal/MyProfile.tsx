import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import type { DriverContext } from '../../types'
import { CarFront, User, Flag, BadgeCheck, PenLine, Hash, Car, Calendar, Palette, type LucideIcon } from 'lucide-react'

const SALARY_TYPE_LABELS: Record<string, string> = {
  commission: 'Commission',
  target_high: 'Target (High)',
  target_low: 'Target (Low)',
}

export default function MyProfile() {
  const { data: ctx, isLoading } = useQuery<DriverContext>({
    queryKey: ['portal-me'],
    queryFn: () => apiGet('/portal/me'),
  })

  if (isLoading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2 pb-1">
        <h2 className="text-lg font-bold text-primary">My Profile</h2>
        <p className="text-sm text-muted">Your account details</p>
      </div>

      {/* Avatar + name hero */}
      <div className="bg-primary rounded-2xl p-5 flex items-center gap-4 text-white">
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <User size={32} />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-tight truncate">{ctx?.full_name ?? '—'}</p>
          <p className="text-sm opacity-80 truncate">{ctx?.email ?? '—'}</p>
        </div>
      </div>

      {/* Personal details */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface">
          <p className="text-sm font-semibold text-primary">Personal Details</p>
        </div>
        <ProfileRow icon={Flag} label="Nationality" value={ctx?.nationality ?? 'Not set'} />
        <ProfileRow icon={BadgeCheck} label="Salary Type" value={SALARY_TYPE_LABELS[ctx?.salary_type ?? ''] ?? ctx?.salary_type ?? '—'} />
        <ProfileRow
          icon={PenLine}
          label="Self Entry"
          value={ctx?.self_entry_enabled ? 'Enabled — you can log your own trips' : 'Disabled'}
          valueClass={ctx?.self_entry_enabled ? 'text-emerald-600' : 'text-muted'}
          last
        />
      </div>

      {/* Vehicle */}
      {ctx?.vehicle ? (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface">
            <p className="text-sm font-semibold text-primary">Assigned Vehicle</p>
          </div>
          <ProfileRow icon={Hash} label="Plate Number" value={ctx.vehicle.plate_number} />
          <ProfileRow icon={Car} label="Model" value={`${ctx.vehicle.make} ${ctx.vehicle.model}`} />
          <ProfileRow icon={Calendar} label="Year" value={String(ctx.vehicle.year)} />
          {ctx.vehicle.color && (
            <ProfileRow icon={Palette} label="Colour" value={ctx.vehicle.color} last />
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border px-4 py-5 flex items-center gap-3 text-muted">
          <CarFront size={22} />
          <p className="text-sm">No vehicle currently assigned</p>
        </div>
      )}
    </div>
  )
}

function ProfileRow({
  icon: Icon,
  label,
  value,
  valueClass = 'text-primary',
  last = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  valueClass?: string
  last?: boolean
}) {
  return (
    <div className={`px-4 py-3 flex items-center gap-3 ${last ? '' : 'border-b border-border'}`}>
      <Icon size={20} className="text-muted shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className={`text-sm font-medium truncate ${valueClass}`}>{value}</p>
      </div>
    </div>
  )
}
