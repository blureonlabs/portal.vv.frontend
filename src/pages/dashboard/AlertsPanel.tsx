import { useNavigate } from 'react-router-dom'
import { formatAed } from '../../lib/utils'
import {
  AlertCircle, AlertTriangle, X, Wallet, Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { DashboardKpis, DocumentExpiryAlert } from '../../types'

const ICON_MAP: Record<string, LucideIcon> = {
  error: AlertCircle,
  warning: AlertTriangle,
  close: X,
  account_balance_wallet: Wallet,
  build: Wrench,
}

function MsIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name]
  if (!Icon) return null
  const sizeMatch = className?.match(/text-\[(\d+)px\]/) || className?.match(/text-(\w+)/)
  let size = 20
  if (sizeMatch) {
    const val = parseInt(sizeMatch[1])
    if (!isNaN(val)) size = val
  }
  if (className?.includes('text-4xl')) size = 36
  if (className?.includes('text-lg')) size = 18
  const filteredClass = (className ?? '')
    .replace(/text-\[\d+px\]/g, '')
    .replace(/text-4xl/g, '')
    .replace(/text-lg/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return <Icon size={size} className={filteredClass || undefined} />
}

const DOC_TYPE_LABELS: Record<string, string> = {
  license: 'Driving License',
  visa: 'Visa',
  passport: 'Passport',
  emirates_id: 'Emirates ID',
  medical: 'Medical Certificate',
  registration_card: 'Registration Card',
  insurance_certificate: 'Insurance Certificate',
  receipt: 'Receipt',
  other: 'Other',
}

function docTypeLabel(dt: string): string {
  return DOC_TYPE_LABELS[dt] ?? dt
}

function docAlertKey(a: DocumentExpiryAlert): string {
  return `doc-expiry-${a.document_id}`
}

export function AlertsPanel({ kpis, dismissed, dismiss }: {
  kpis?: DashboardKpis
  dismissed: Set<string>
  dismiss: (id: string) => void
}) {
  const navigate = useNavigate()

  if (!kpis) return null

  return (
    <>
      {/* Document Expiry Alerts */}
      {kpis.document_expiry_alerts.filter(a => !dismissed.has(docAlertKey(a))).length > 0 && (
        <div className="space-y-2">
          {kpis.document_expiry_alerts.filter(a => !dismissed.has(docAlertKey(a))).map((a) => (
            <div
              key={a.document_id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                a.is_expired
                  ? 'bg-red-100 border border-red-300 text-red-900'
                  : a.days_until_expiry <= 7
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}
            >
              <MsIcon
                name={a.is_expired ? 'error' : 'warning'}
                className="text-lg flex-shrink-0"
              />
              <span className="flex-1">
                <strong>{a.entity_name}</strong>{' '}
                <span className="opacity-75">({a.entity_type})</span>
                {' — '}
                {docTypeLabel(a.doc_type)}{' '}
                {a.is_expired
                  ? <>
                      <strong>expired</strong> on{' '}
                      {new Date(a.expiry_date).toLocaleDateString('en-GB')}{' '}
                      ({Math.abs(a.days_until_expiry)} day{Math.abs(a.days_until_expiry) !== 1 ? 's' : ''} ago)
                    </>
                  : <>
                      expires in{' '}
                      <strong>{a.days_until_expiry} day{a.days_until_expiry !== 1 ? 's' : ''}</strong>{' '}
                      ({new Date(a.expiry_date).toLocaleDateString('en-GB')})
                    </>
                }
              </span>
              <button
                onClick={() => navigate(a.entity_type === 'driver' ? '/drivers' : '/vehicles')}
                className="text-xs underline underline-offset-2 whitespace-nowrap cursor-pointer"
              >
                View
              </button>
              <button
                onClick={() => dismiss(docAlertKey(a))}
                aria-label="Dismiss"
                className="p-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer rounded"
              >
                <MsIcon name="close" className="text-lg" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Insurance Alerts */}
      {kpis.insurance_expiring_soon.filter(a => !dismissed.has(`insurance-${a.vehicle_id}`)).length > 0 && (
        <div className="space-y-2">
          {kpis.insurance_expiring_soon.filter(a => !dismissed.has(`insurance-${a.vehicle_id}`)).map((a) => (
            <div
              key={a.vehicle_id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                a.is_expired
                  ? 'bg-red-100 border border-red-300 text-red-900'
                  : a.days_left <= 7
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}
            >
              <MsIcon name="warning" className="text-lg flex-shrink-0" />
              <span className="flex-1">
                Vehicle <strong>{a.plate_number}</strong>{' '}
                {a.is_expired
                  ? <>insurance <strong>expired</strong> on {new Date(a.insurance_expiry).toLocaleDateString('en-GB')}</>
                  : <>insurance expires in <strong>{a.days_left} day{a.days_left !== 1 ? 's' : ''}</strong>{' '}({new Date(a.insurance_expiry).toLocaleDateString('en-GB')})</>
                }
              </span>
              <button onClick={() => navigate('/vehicles')} className="text-xs underline underline-offset-2 whitespace-nowrap cursor-pointer">View</button>
              <button onClick={() => dismiss(`insurance-${a.vehicle_id}`)} aria-label="Dismiss" className="p-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer rounded">
                <MsIcon name="close" className="text-lg" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Cash Shortfall Alerts */}
      {kpis.cash_shortfall_drivers.filter(a => !dismissed.has(`shortfall-${a.driver_id}`)).length > 0 && (
        <div className="space-y-2">
          {kpis.cash_shortfall_drivers.filter(a => !dismissed.has(`shortfall-${a.driver_id}`)).map((a) => (
            <div key={a.driver_id} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium bg-red-50 border border-red-200 text-red-800">
              <MsIcon name="account_balance_wallet" className="text-lg flex-shrink-0" />
              <span className="flex-1">
                <strong>{a.driver_name}</strong> has a cash shortfall of{' '}
                <strong>{formatAed(a.shortfall)}</strong>{' '}
                (received {formatAed(a.cash_received)}, submitted {formatAed(a.cash_submitted)})
              </span>
              <button onClick={() => dismiss(`shortfall-${a.driver_id}`)} aria-label="Dismiss" className="p-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer rounded">
                <MsIcon name="close" className="text-lg" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Service Overdue Alerts */}
      {kpis.service_overdue_vehicles.filter(a => !dismissed.has(`svc-overdue-${a.vehicle_id}`)).length > 0 && (
        <div className="space-y-2">
          {kpis.service_overdue_vehicles.filter(a => !dismissed.has(`svc-overdue-${a.vehicle_id}`)).map((a) => (
            <div key={a.vehicle_id} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium bg-amber-50 border border-amber-200 text-amber-800">
              <MsIcon name="build" className="text-lg flex-shrink-0" />
              <span className="flex-1">
                Vehicle <strong>{a.plate_number}</strong> — {a.service_type} service was due on{' '}
                <strong>{new Date(a.next_due).toLocaleDateString('en-GB')}</strong>
              </span>
              <button onClick={() => navigate('/vehicles')} className="text-xs underline underline-offset-2 whitespace-nowrap cursor-pointer">View</button>
              <button onClick={() => dismiss(`svc-overdue-${a.vehicle_id}`)} aria-label="Dismiss" className="p-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer rounded">
                <MsIcon name="close" className="text-lg" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
