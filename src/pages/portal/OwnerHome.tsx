import { useQuery } from '@tanstack/react-query'
import { Building2, Phone, Mail, Car } from 'lucide-react'
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
        <div className="animate-spin h-6 w-6 border-2 border-brand border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!ctx) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Unable to load owner information.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-5">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-sm text-gray-500">Welcome back,</p>
        <h1 className="text-2xl font-bold text-gray-900">{ctx.full_name}</h1>
      </div>

      {/* Owner Info Card */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Your Information</h3>

        <div className="space-y-2.5">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700">{ctx.email}</span>
          </div>
          {ctx.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{ctx.phone}</span>
            </div>
          )}
          {ctx.company_name && (
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{ctx.company_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Vehicles */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Your Vehicles</h3>

        {ctx.vehicles.length === 0 && (
          <div className="bg-white rounded-2xl border border-border p-5 text-center">
            <Car className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No vehicles linked to your account yet.</p>
          </div>
        )}

        {ctx.vehicles.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{v.plate_number}</p>
              <p className="text-xs text-gray-500">
                {v.make} {v.model} {v.year}{v.color ? ` - ${v.color}` : ''}
              </p>
              {v.assigned_driver_name && (
                <p className="text-xs text-gray-400 mt-0.5">Driver: {v.assigned_driver_name}</p>
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
