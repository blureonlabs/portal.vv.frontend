import { Car, MapPin, MessageCircle } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'

const INTEGRATIONS = [
  {
    name: 'Uber',
    description: 'Auto-import trip data from Uber driver API',
    icon: Car,
    status: 'coming_soon',
  },
  {
    name: 'GPS Tracking',
    description: 'Real-time vehicle location tracking and route history',
    icon: MapPin,
    status: 'coming_soon',
  },
  {
    name: 'WhatsApp',
    description: 'Send automated alerts and notifications via WhatsApp Business API',
    icon: MessageCircle,
    status: 'coming_soon',
  },
]

export default function IntegrationSettings() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {INTEGRATIONS.map((integration) => (
        <div key={integration.name} className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <integration.icon size={20} className="text-primary" />
            </div>
            <Badge variant="muted">Coming Soon</Badge>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary">{integration.name}</h3>
            <p className="text-xs text-muted mt-1">{integration.description}</p>
          </div>
          <button disabled className="mt-auto px-4 py-2 rounded-full border border-border text-sm font-medium text-muted opacity-50 cursor-not-allowed">
            Configure
          </button>
        </div>
      ))}
    </div>
  )
}
