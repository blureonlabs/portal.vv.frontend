import { useConfigTable } from '../../hooks/useConfigTable'
import { useToast } from '../../components/ui/Toast'
import { ConfigCrudTable } from './ConfigCrudTable'
import type { ConfigItem } from '../../types'

export default function ExpenseCategorySettings() {
  const { list, create, update, remove } = useConfigTable<ConfigItem>('expense-categories')
  const toast = useToast()

  return (
    <ConfigCrudTable
      title="Expense Categories"
      items={list.data ?? []}
      isLoading={list.isLoading}
      addPending={create.isPending}
      onAdd={(data) => {
        create.mutate(
          { name: data.name, code: data.code },
          {
            onSuccess: () => toast.add('Category created', 'success'),
            onError: (e) => toast.add(e instanceof Error ? e.message : 'Failed to create', 'error'),
          },
        )
      }}
      onUpdate={(id, data) => {
        update.mutate(
          { id, ...data },
          {
            onSuccess: () => toast.add('Category updated', 'success'),
            onError: (e) => toast.add(e instanceof Error ? e.message : 'Failed to update', 'error'),
          },
        )
      }}
      onDelete={(id) => {
        remove.mutate(id, {
          onSuccess: () => toast.add('Category deactivated', 'success'),
          onError: (e) => toast.add(e instanceof Error ? e.message : 'Failed to deactivate', 'error'),
        })
      }}
    />
  )
}
