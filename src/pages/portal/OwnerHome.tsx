import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'

interface OwnerContext {
  id: string
  profile_id: string
  full_name: string
  email: string
  phone: string | null
  company_name: string | null
  notes: string | null
  is_active: boolean
  vehicles: {
    id: string
    plate_number: string
    make: string
    model: string
    year: number
    color: string | null
    status: string
    assigned_driver_name: string | null
  }[]
}

export default function OwnerHome() {
  const { data: ctx, isLoading } = useQuery<OwnerContext>({
    queryKey: ['owner-me'],
    queryFn: () => apiGet('/owner/me'),
  })

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[200px]">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!ctx) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted">Unable to load owner information.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-5">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-sm text-muted">Welcome back,</p>
        <h1 className="text-2xl font-bold text-primary">{ctx.full_name}</h1>
      </div>

      {/* Owner Info Card */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
        <h3 className="text-sm font-semibold text-primary">Your Information</h3>

        <div className="space-y-2.5">
          <div className="flex items-center gap-3 text-sm">
            <span className="material-symbols-rounded text-[16px] text-muted flex-shrink-0">mail</span>
            <span className="text-primary">{ctx.email}</span>
          </div>
          {ctx.phone && (
            <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-rounded text-[16px] text-muted flex-shrink-0">phone</span>
              <span className="text-primary">{ctx.phone}</span>
            </div>
          )}
          {ctx.company_name && (
            <div className="flex items-center gap-3 text-sm">
              <span className="material-symbols-rounded text-[16px] text-muted flex-shrink-0">apartment</span>
              <span className="text-primary">{ctx.company_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Vehicles */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-primary">Your Vehicles</h3>

        {ctx.vehicles.length === 0 && (
          <div className="bg-white rounded-2xl border border-border p-5 text-center">
            <span className="material-symbols-rounded text-[32px] text-muted mx-auto mb-2">directions_car</span>
            <p className="text-sm text-muted">No vehicles linked to your account yet.</p>
          </div>
        )}

        {ctx.vehicles.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-rounded text-[20px] text-primary">directions_car</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">{v.plate_number}</p>
              <p className="text-xs text-muted">
                {v.make} {v.model} {v.year}{v.color ? ` - ${v.color}` : ''}
              </p>
              {v.assigned_driver_name && (
                <p className="text-xs text-muted mt-0.5">Driver: {v.assigned_driver_name}</p>
              )}
            </div>
            <Badge variant={v.status === 'available' ? 'success' : v.status === 'assigned' ? 'default' : 'muted'}>
              {v.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
