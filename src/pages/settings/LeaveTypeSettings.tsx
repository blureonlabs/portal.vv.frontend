import { useConfigTable } from '../../hooks/useConfigTable'
import { useToast } from '../../components/ui/Toast'
import { ConfigCrudTable } from './ConfigCrudTable'
import type { ConfigItem } from '../../types'

export default function LeaveTypeSettings() {
  const { list, create, update, remove } = useConfigTable<ConfigItem>('leave-types')
  const toast = useToast()

  return (
    <ConfigCrudTable
      title="Leave Types"
      items={list.data ?? []}
      isLoading={list.isLoading}
      addPending={create.isPending}
      onAdd={(data) => {
        create.mutate(
          { name: data.name, code: data.code },
          {
            onSuccess: () => toast.add('Leave type created', 'success'),
            onError: (e) => toast.add(e instanceof Error ? e.message : 'Failed to create', 'error'),
          },
        )
      }}
      onUpdate={(id, data) => {
        update.mutate(
          { id, ...data },
          {
            onSuccess: () => toast.add('Leave type updated', 'success'),
            onError: (e) => toast.add(e instanceof Error ? e.message : 'Failed to update', 'error'),
          },
        )
      }}
      onDelete={(id) => {
        remove.mutate(id, {
          onSuccess: () => toast.add('Leave type deactivated', 'success'),
          onError: (e) => toast.add(e instanceof Error ? e.message : 'Failed to deactivate', 'error'),
        })
      }}
    />
  )
}
