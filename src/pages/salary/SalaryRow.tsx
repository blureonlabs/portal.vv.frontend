import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { formatAed } from '../../lib/utils'
import type { Salary, SalaryStatusType, SalaryType } from '../../types'
import { ChevronDown, ChevronUp, Download, FileText, Pencil, Printer } from 'lucide-react'
import { useToast } from '../../components/ui/Toast'
import { MarkPaidDialog } from './MarkPaidDialog'

const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  commission: 'Commission',
  target_high: 'Target High',
  target_low: 'Target Low',
}

const STATUS_LABELS: Record<SalaryStatusType, string> = {
  draft: 'Draft',
  approved: 'Approved',
  paid: 'Paid',
}

type StatusVariant = 'muted' | 'warning' | 'success'
const STATUS_VARIANTS: Record<SalaryStatusType, StatusVariant> = {
  draft: 'muted',
  approved: 'warning',
  paid: 'success',
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-2 ${highlight ? 'bg-primary/5 border border-primary/20' : 'bg-surface'}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-semibold ${highlight ? 'text-primary' : 'text-primary'}`}>{value}</p>
    </div>
  )
}

export function SalaryRow({ s, canAdmin, setEditingSalary }: { s: Salary; canAdmin: boolean; setEditingSalary: (s: Salary | null) => void }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [payDialog, setPayDialog] = useState(false)
  const [confirmApprove, setConfirmApprove] = useState(false)

  const toast = useToast()
  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: () => apiPost(`/salaries/${s.id}/approve`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salaries'] }); toast.add('Salary approved', 'success') },
    onError: (e: Error) => toast.add(e.message, 'error'),
  })

  const [slipError, setSlipError] = useState('')
  const generateSlipMut = useMutation({
    mutationFn: (salaryId: string) => apiGet<{ slip_url: string }>(`/salaries/${salaryId}/slip`),
    onSuccess: () => { setSlipError(''); qc.invalidateQueries({ queryKey: ['salaries'] }); toast.add('Salary slip generated', 'success') },
    onError: (e: Error) => { setSlipError(e.message); toast.add(e.message, 'error') },
  })

  return (
    <>
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <button
          className="w-full px-4 py-3 flex items-center justify-between flex-wrap gap-2 text-left hover:bg-surface transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-primary">{s.driver_name}</p>
              <p className="text-xs text-muted">{s.period_month}</p>
            </div>
            <Badge variant="default">{SALARY_TYPE_LABELS[s.salary_type_snapshot]}</Badge>
            <Badge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</Badge>
            {s.adjusted_from_id && (
              <Badge variant="default">Adjusted</Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {canAdmin && s.status === 'draft' && (
              <button onClick={(e) => { e.stopPropagation(); setEditingSalary(s) }} className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                <Pencil size={14} />
                Edit
              </button>
            )}
            {canAdmin && s.status === 'draft' && (
              <Button
                variant="outline"
                size="sm"
                disabled={approving}
                onClick={(e) => { e.stopPropagation(); setConfirmApprove(true) }}
              >
                {approving ? '\u2026' : 'Approve'}
              </Button>
            )}
            {canAdmin && s.status === 'approved' && (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); setPayDialog(true) }}
              >
                Mark Paid
              </Button>
            )}
            <div className="text-right">
              <p className="text-xs text-muted">Net Payable</p>
              <p className="text-base font-bold text-primary">{formatAed(parseFloat(s.net_payable_aed))}</p>
            </div>
            {open
              ? <ChevronUp size={16} className="text-muted" />
              : <ChevronDown size={16} className="text-muted" />}
          </div>
        </button>

        {open && (
          <div className="px-4 pb-4 border-t border-border pt-3 text-sm space-y-3">
            {/* Earnings breakdown */}
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Earnings</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Row label="Total Earnings" value={formatAed(parseFloat(s.total_earnings_aed))} />
                {s.commission_aed != null && <Row label="Commission" value={formatAed(parseFloat(s.commission_aed))} />}
                {s.target_amount_aed != null && <Row label="Target Bonus" value={formatAed(parseFloat(s.target_amount_aed))} />}
                <Row label="Base Amount" value={formatAed(parseFloat(s.base_amount_aed))} />
                {parseFloat(s.incentives_aed) > 0 && (
                  <Row label="Incentives" value={formatAed(parseFloat(s.incentives_aed))} />
                )}
              </div>
            </div>

            {/* Deductions breakdown */}
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Deductions</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Row label="Salik" value={formatAed(parseFloat(s.salik_aed))} />
                <Row label="RTA Fine" value={formatAed(parseFloat(s.rta_fine_aed))} />
                <Row label="Card Charges" value={formatAed(parseFloat(s.card_service_charges_aed))} />
                {s.room_rent_aed != null && <Row label="Room Rent" value={formatAed(parseFloat(s.room_rent_aed))} />}
                {s.car_charging_diff_aed != null && <Row label="Car Charging Diff" value={formatAed(parseFloat(s.car_charging_diff_aed))} />}
                {s.cash_not_handover_aed !== '0.00' && <Row label="Cash Not Handover" value={formatAed(parseFloat(s.cash_not_handover_aed))} />}
                <Row label="Advance Deduction" value={formatAed(parseFloat(s.advance_deduction_aed))} />
                {parseFloat(s.carry_forward_balance_aed) > 0 && (
                  <Row label="Carry Forward Balance" value={formatAed(parseFloat(s.carry_forward_balance_aed))} />
                )}
              </div>
            </div>

            {/* Summary */}
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Summary</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Row label="Final Salary" value={formatAed(parseFloat(s.final_salary_aed))} highlight />
                <Row label="Net Payable" value={formatAed(parseFloat(s.net_payable_aed))} highlight />
              </div>
              {parseFloat(s.net_payable_aed) < 0 && (
                <p className="text-xs text-danger mt-1">Negative balance will carry forward to next month</p>
              )}
            </div>

            {/* Payment info if paid */}
            {s.status === 'paid' && (
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Payment</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {s.payment_date && <Row label="Payment Date" value={s.payment_date} />}
                  {s.payment_mode && <Row label="Mode" value={s.payment_mode.replace('_', ' ')} />}
                  {s.payment_reference && <Row label="Reference" value={s.payment_reference} />}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted">
                Generated by {s.generated_by_name} on {new Date(s.generated_at).toLocaleDateString('en-GB')}
                {s.approved_at && ` · Approved ${new Date(s.approved_at).toLocaleDateString('en-GB')}`}
              </p>
              <div className="flex items-center gap-3">
                {s.slip_url?.startsWith('http') ? (
                  <a href={s.slip_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                    <Download size={14} />
                    Download Slip
                  </a>
                ) : (
                  <button
                    onClick={() => generateSlipMut.mutate(s.id)}
                    disabled={generateSlipMut.isPending}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-50"
                  >
                    <FileText size={14} />
                    {generateSlipMut.isPending ? 'Generating\u2026' : 'Generate Slip'}
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary hover:underline"
                >
                  <Printer size={14} />
                  Print
                </button>
              </div>
              {slipError && <p className="text-xs text-danger">{slipError}</p>}
            </div>
          </div>
        )}
      </div>

      <MarkPaidDialog salaryId={s.id} open={payDialog} onClose={() => setPayDialog(false)} />
      <ConfirmDialog
        open={confirmApprove}
        title="Approve Salary"
        message={`Approve salary for ${s.driver_name} (${s.period_month})?`}
        confirmLabel="Approve"
        variant="primary"
        onConfirm={() => { approve(); setConfirmApprove(false) }}
        onCancel={() => setConfirmApprove(false)}
      />
    </>
  )
}
