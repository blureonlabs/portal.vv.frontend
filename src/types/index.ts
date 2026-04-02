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
  created_at: string
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
