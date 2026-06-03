import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useAuthStore } from '../../store/authStore'
import type { Driver, Salary, SalaryType } from '../../types'
import { CreditCard as CreditCardIcon, Plus } from 'lucide-react'
import { SalaryRow } from './SalaryRow'
import { SalaryForm } from './SalaryForm'
import { EditSalaryDialog } from './EditSalaryDialog'

export default function SalaryPage() {
  const { user } = useAuthStore()
  const canAdmin = user?.role === 'super_admin' || user?.role === 'accountant'

  const [showForm, setShowForm] = useState(false)
  const [filterDriver, setFilterDriver] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterType, setFilterType] = useState<SalaryType | ''>('')
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null)

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
  })

  const { data: salaries = [], isLoading } = useQuery<Salary[]>({
    queryKey: ['salaries', filterDriver, filterMonth],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filterDriver) params.set('driver_id', filterDriver)
      if (filterMonth) params.set('month', filterMonth)
      return apiGet(`/salaries?${params}`)
    },
  })

  const activeDrivers = drivers.filter((d) => d.is_active)

  const filteredSalaries = filterType
    ? salaries.filter((s) => s.salary_type_snapshot === filterType)
    : salaries

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Salary</h1>
          <p className="text-muted">Generate and view driver salary slips</p>
        </div>
        {canAdmin && (
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} className="mr-2" /> Generate
          </Button>
        )}
      </div>

      {/* Generate form */}
      {showForm && (
        <SalaryForm activeDrivers={activeDrivers} onClose={() => setShowForm(false)} />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filterDriver}
          onChange={(e) => setFilterDriver(e.target.value)}
          options={[{ value: '', label: 'All Drivers' }, ...drivers.map((d) => ({ value: d.id, label: d.full_name }))]}
          placeholder="All Drivers"
          className="min-w-[180px]"
        />
        <Input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="max-w-[200px]"
        />
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as SalaryType | '')}
          options={[
            { value: '', label: 'All Types' },
            { value: 'commission', label: 'Commission' },
            { value: 'target_high', label: 'Target High' },
            { value: 'target_low', label: 'Target Low' },
          ]}
          placeholder="All Types"
          className="min-w-[160px]"
        />
      </div>

      {/* Salary list */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredSalaries.length === 0 ? (
        <EmptyState icon={CreditCardIcon} title="No salary records found" description="Generate a salary to get started." />
      ) : (
        <div className="space-y-3">
          {filteredSalaries.map((s) => <SalaryRow key={s.id} s={s} canAdmin={canAdmin} setEditingSalary={setEditingSalary} />)}
        </div>
      )}

      {editingSalary && (
        <EditSalaryDialog salary={editingSalary} onClose={() => setEditingSalary(null)} />
      )}
    </div>
  )
}
