export type Role = 'super_admin' | 'accountant' | 'hr' | 'driver' | 'owner'
export type SalaryType = 'commission' | 'target_high' | 'target_low'
export type VehicleStatus = 'available' | 'assigned' | 'inactive'

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
  phone?: string | null
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

export interface Owner {
  id: string
  profile_id: string
  full_name: string
  email: string
  phone: string | null
  company_name: string | null
  notes: string | null
  is_active: boolean
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

export interface AssignedVehicle {
  id: string
  plate_number: string
  make: string
  model: string
  year: number
  color: string | null
}

export interface DriverContext {
  profile_id: string
  full_name: string
  email: string
  driver_id: string
  salary_type: SalaryType
  nationality: string | null
  self_entry_enabled: boolean
  vehicle: AssignedVehicle | null
}

export interface DayEarnings {
  date: string
  cash_aed: string
  card_aed: string
  other_aed: string
  total_aed: string
}

export interface EarningsReport {
  month: string
  days: DayEarnings[]
  total_cash: string
  total_card: string
  total_other: string
  grand_total: string
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

export interface Salary {
  id: string
  driver_id: string
  driver_name: string
  period_month: string
  salary_type_snapshot: SalaryType
  total_earnings_aed: string
  total_cash_received_aed: string
  total_cash_submit_aed: string | null
  cash_not_handover_aed: string
  cash_diff_aed: string | null
  car_charging_aed: string
  car_charging_used_aed: string | null
  car_charging_diff_aed: string | null
  salik_used_aed: string
  salik_refund_aed: string
  salik_aed: string
  rta_fine_aed: string
  card_service_charges_aed: string
  room_rent_aed: string | null
  target_amount_aed: string | null
  fixed_car_charging_aed: string | null
  commission_aed: string | null
  base_amount_aed: string
  final_salary_aed: string
  advance_deduction_aed: string
  net_payable_aed: string
  deductions_json: object | null
  slip_url: string | null
  generated_by: string
  generated_by_name: string
  generated_at: string
}

export interface InsuranceAlert {
  vehicle_id: string
  plate_number: string
  insurance_expiry: string
  days_left: number
}

export interface DriverPerf {
  driver_id: string
  driver_name: string
  trips_count: number
  revenue_aed: string
}

export interface DayRevenue {
  date: string
  revenue_aed: string
  trips_count: number
}

export interface Broadcast {
  id: string
  subject: string
  body: string
  channel: 'email' | 'whatsapp'
  target: 'all_drivers' | 'selected_drivers'
  recipient_count: number
  status: 'draft' | 'sending' | 'sent' | 'failed'
  sent_by_name: string
  created_at: string
}

export type DocumentType = 'license' | 'visa' | 'passport' | 'emirates_id' | 'medical' | 'registration_card' | 'insurance_certificate' | 'receipt' | 'other'

export interface Document {
  id: string
  entity_type: 'driver' | 'vehicle'
  entity_id: string
  doc_type: DocumentType
  file_url: string
  file_name: string
  expiry_date: string | null
  uploaded_by: string
  notes: string | null
  created_at: string
}

export interface DashboardKpis {
  revenue_mtd: string
  revenue_cash_mtd: string
  revenue_card_mtd: string
  revenue_other_mtd: string
  trips_mtd: number
  active_drivers: number
  active_vehicles: number
  pending_advances: number
  pending_leave: number
  total_expenses_mtd: string
  net_profit: string
  insurance_expiring_soon: InsuranceAlert[]
  top_drivers: DriverPerf[]
  revenue_trend: DayRevenue[]
}
