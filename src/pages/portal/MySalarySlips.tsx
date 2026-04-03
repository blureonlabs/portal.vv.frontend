import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { formatAed, formatDate } from '../../lib/utils'
import type { Salary, SalaryType } from '../../types'

const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  commission: 'Commission',
  target_high: 'Target (High)',
  target_low: 'Target (Low)',
}

function periodLabel(period: string) {
  // period is YYYY-MM
  return new Date(period + '-01').toLocaleString('en-AE', { month: 'long', year: 'numeric' })
}

export default function MySalarySlips() {
  const { data: slips = [], isLoading } = useQuery<Salary[]>({
    queryKey: ['portal-salary-slips'],
    queryFn: () => apiGet('/salaries'),
  })

  // Sort descending by period_month
  const sorted = [...slips].sort((a, b) => b.period_month.localeCompare(a.period_month))

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h2 className="text-lg font-bold text-primary">My Salary Slips</h2>
        <p className="text-sm text-muted">Generated salary records</p>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
          <span className="material-symbols-rounded text-[48px] opacity-30">receipt_long</span>
          <p className="text-sm">No salary slips yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((slip) => (
            <SlipCard key={slip.id} slip={slip} />
          ))}
        </div>
      )}
    </div>
  )
}

function SlipCard({ slip }: { slip: Salary }) {
  const netPayable = parseFloat(slip.net_payable_aed)
  const isPositive = netPayable >= 0

  return (
    <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-bold text-primary">{periodLabel(slip.period_month)}</p>
          <p className="text-xs text-muted mt-0.5">
            {SALARY_TYPE_LABELS[slip.salary_type_snapshot] ?? slip.salary_type_snapshot}
          </p>
        </div>
        <div className={`text-right`}>
          <p className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatAed(netPayable)}
          </p>
          <p className="text-xs text-muted">Net Payable</p>
        </div>
      </div>

      {/* Earnings breakdown */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1 border-t border-border">
        <DetailRow label="Total Earnings" value={formatAed(slip.total_earnings_aed)} />
        <DetailRow label="Base Amount" value={formatAed(slip.base_amount_aed)} />
        {slip.commission_aed && parseFloat(slip.commission_aed) > 0 && (
          <DetailRow label="Commission" value={formatAed(slip.commission_aed)} />
        )}
        {parseFloat(slip.advance_deduction_aed) > 0 && (
          <DetailRow label="Advance Deduction" value={`-${formatAed(slip.advance_deduction_aed)}`} valueClass="text-red-600" />
        )}
        {parseFloat(slip.salik_aed) > 0 && (
          <DetailRow label="Salik" value={`-${formatAed(slip.salik_aed)}`} valueClass="text-red-600" />
        )}
      </div>

      {/* Footer: generated date + PDF link */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <p className="text-xs text-muted">
          Generated {formatDate(slip.generated_at)}
        </p>
        {slip.slip_url ? (
          <a
            href={slip.slip_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span className="material-symbols-rounded text-[15px]">picture_as_pdf</span>
            Download PDF
          </a>
        ) : (
          <span className="text-xs text-muted italic">No PDF available</span>
        )}
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  valueClass = 'text-primary',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-sm font-medium ${valueClass}`}>{value}</p>
    </div>
  )
}
