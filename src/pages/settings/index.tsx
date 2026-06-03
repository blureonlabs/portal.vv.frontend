import { useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { TabView } from '../../components/ui/TabView'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuthStore } from '../../store/authStore'
import GeneralSettings from './GeneralSettings'
import PlatformSettings from './PlatformSettings'
import ExpenseCategorySettings from './ExpenseCategorySettings'
import LeaveTypeSettings from './LeaveTypeSettings'
import DocumentTypeSettings from './DocumentTypeSettings'

const ALL_TABS = [
  { key: 'general', label: 'General' },
  { key: 'platforms', label: 'Platforms' },
  { key: 'expense-categories', label: 'Expense Categories' },
  { key: 'leave-types', label: 'Leave Types' },
  { key: 'document-types', label: 'Document Types' },
]

const ACCOUNTANT_TABS = [
  { key: 'general', label: 'General' },
]

export default function Settings() {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'super_admin'
  const tabs = isSuperAdmin ? ALL_TABS : ACCOUNTANT_TABS
  const [activeTab, setActiveTab] = useState(tabs[0].key)

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon size={24} className="text-primary" />
        <PageHeader title="Settings" description="Manage application configuration" />
      </div>

      <TabView tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div>
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'platforms' && <PlatformSettings />}
        {activeTab === 'expense-categories' && <ExpenseCategorySettings />}
        {activeTab === 'leave-types' && <LeaveTypeSettings />}
        {activeTab === 'document-types' && <DocumentTypeSettings />}
      </div>
    </div>
  )
}
