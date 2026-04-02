export type Role = 'super_admin' | 'accountant' | 'hr' | 'driver'
export type SalaryType = 'commission' | 'target_high' | 'target_low'
export type VehicleStatus = 'available' | 'assigned' | 'inactive'

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
  is_active: boolean
  created_at: string
}

export interface Invite {
  id: string
  email: string
  role: Role
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  expires_at: string
  created_at: string
}

export interface Driver {
  id: string
  profile_id: string
  full_name: string
  email: string
  nationality: string
  salary_type: SalaryType
  is_active: boolean
  self_entry_enabled: boolean
  created_at: string
}

export type TripSource = 'manual' | 'csv_import' | 'uber_api'
export type ExpenseCategory = 'fuel' | 'maintenance' | 'toll' | 'insurance' | 'fines' | 'other'

export interface Trip {
  id: string
  driver_id: string
  driver_name: string
  vehicle_id: string | null
  trip_date: string
  cash_aed: string
  card_aed: string
  other_aed: string
  total_aed: string
  source: TripSource
  notes: string | null
  created_at: string
}

export interface CsvPreviewRow {
  row_num: number
  trip_date: string
  cash_aed: string
  card_aed: string
  other_aed: string
  notes: string | null
  error: string | null
  cap_warning: string | null
}

export interface Expense {
  id: string
  driver_id: string | null
  driver_name: string | null
  amount_aed: string
  category: ExpenseCategory
  date: string
  receipt_url: string | null
  notes: string | null
  created_at: string
}

export interface CashHandover {
  id: string
  driver_id: string
  driver_name: string
  amount_aed: string
  submitted_at: string
  verified_by: string
  verifier_name: string
}

export interface LineItem {
  description: string
  amount_aed: string
}

export interface Invoice {
  id: string
  driver_id: string
  driver_name: string
  invoice_no: string
  period_start: string
  period_end: string
  line_items: LineItem[]
  total_aed: string
  pdf_url: string | null
  generated_by: string
  generated_by_name: string
  created_at: string
}

export type LeaveType = 'leave' | 'permission'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveRequest {
  id: string
  driver_id: string
  driver_name: string
  type: LeaveType
  from_date: string
  to_date: string
  reason: string
  status: LeaveStatus
  actioned_by: string | null
  actioned_by_name: string | null
  rejection_reason: string | null
  created_at: string
}

export type AdvanceStatus = 'pending' | 'approved' | 'rejected' | 'paid'
export type PaymentMethod = 'cash' | 'bank_transfer'

export interface Advance {
  id: string
  driver_id: string
  driver_name: string
  amount_aed: string
  reason: string
  status: AdvanceStatus
  rejection_reason: string | null
  payment_date: string | null
  method: PaymentMethod | null
  carry_forward_aed: string
  salary_period: string | null
  actioned_by: string | null
  actioned_by_name: string | null
  created_at: string
  updated_at: string
}

export interface DriverEdit {
  id: string
  driver_id: string
  changed_by: string
  field: string
  old_val: string | null
  new_val: string | null
  changed_at: string
}

export interface Vehicle {
  id: string
  plate_number: string
  make: string
  model: string
  year: number
  color: string | null
  registration_date: string | null
  registration_expiry: string | null
  insurance_expiry: string | null
  status: VehicleStatus
  is_active: boolean
  assigned_driver_id: string | null
  assigned_driver_name: string | null
  created_at: string
}

export interface VehicleAssignment {
  id: string
  vehicle_id: string
  driver_id: string
  driver_name: string
  assigned_at: string
  unassigned_at: string | null
  assigned_by: string
}

export interface VehicleServiceRecord {
  id: string
  vehicle_id: string
  service_date: string
  service_type: string
  description: string | null
  cost: string
  next_due: string | null
  logged_by: string
  created_at: string
}

export interface Setting {
  id: string
  key: string
  value: string
  updated_by: string | null
  updated_at: string
}

export interface AuditEntry {
  id: string
  actor_id: string
  actor_role: string
  entity_type: string
  entity_id: string | null
  action: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface DriverSummaryReport {
  driver_id: string
  driver_name: string
  trips_count: number
  total_revenue_aed: string
  total_expenses_aed: string
  net_aed: string
}

export interface TripDetailReport {
  trip_id: string
  driver_name: string
  trip_date: string
  cash_aed: string
  card_aed: string
  other_aed: string
  total_aed: string
  notes: string | null
}

export interface CategoryTotal {
  category: string
  total_aed: string
}

export interface FinanceSummaryReport {
  trip_revenue_cash: string
  trip_revenue_card: string
  trip_revenue_other: string
  trip_revenue_total: string
  expense_by_category: CategoryTotal[]
  total_expenses: string
  total_handovers: string
  net_aed: string
}
