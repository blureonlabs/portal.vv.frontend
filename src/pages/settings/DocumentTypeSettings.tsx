import { useConfigTable } from '../../hooks/useConfigTable'
import { useToast } from '../../components/ui/Toast'
import { ConfigCrudTable } from './ConfigCrudTable'
import type { ConfigDocumentType } from '../../types'

export default function DocumentTypeSettings() {
  const { list, create, update, remove } = useConfigTable<ConfigDocumentType>('document-types')
  const toast = useToast()

  return (
    <ConfigCrudTable
      title="Document Types"
      items={list.data ?? []}
      isLoading={list.isLoading}
      addPending={create.isPending}
      showAppliesTo
      onAdd={(data) => {
        create.mutate(
          { name: data.name, code: data.code, ...(data.applies_to ? { applies_to: data.applies_to } : {}) },
          {
            onSuccess: () => toast.add('Document type created', 'success'),
            onError: (e) => toast.add(e instanceof Error ? e.message : 'Failed to create', 'error'),
          },
        )
      }}
      onUpdate={(id, data) => {
        update.mutate(
          { id, ...data },
          {
            onSuccess: () => toast.add('Document type updated', 'success'),
            onError: (e) => toast.add(e instanceof Error ? e.message : 'Failed to update', 'error'),
          },
        )
      }}
      onDelete={(id) => {
        remove.mutate(id, {
          onSuccess: () => toast.add('Document type deactivated', 'success'),
          onError: (e) => toast.add(e instanceof Error ? e.message : 'Failed to deactivate', 'error'),
        })
      }}
    />
  )
}
