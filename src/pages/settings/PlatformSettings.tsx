import { usePlatforms, useCreatePlatform, useUpdatePlatform, useDeactivatePlatform } from '../../hooks/usePlatforms'
import { useToast } from '../../components/ui/Toast'
import { ConfigCrudTable } from './ConfigCrudTable'

export default function PlatformSettings() {
  const { data: platforms = [], isLoading } = usePlatforms()
  const createMutation = useCreatePlatform()
  const updateMutation = useUpdatePlatform()
  const deactivateMutation = useDeactivatePlatform()
  const toast = useToast()

  return (
    <ConfigCrudTable
      title="Platforms"
      items={platforms}
      isLoading={isLoading}
      addPending={createMutation.isPending}
      onAdd={(data) => {
        createMutation.mutate(
          { name: data.name, code: data.code },
          {
            onSuccess: () => toast.add('Platform created', 'success'),
            onError: (e) => toast.add(e instanceof Error ? e.message : 'Failed to create', 'error'),
          },
        )
      }}
      onUpdate={(id, data) => {
        updateMutation.mutate(
          { id, ...data },
          {
            onSuccess: () => toast.add('Platform updated', 'success'),
            onError: (e) => toast.add(e instanceof Error ? e.message : 'Failed to update', 'error'),
          },
        )
      }}
      onDelete={(id) => {
        deactivateMutation.mutate(id, {
          onSuccess: () => toast.add('Platform deactivated', 'success'),
          onError: (e) => toast.add(e instanceof Error ? e.message : 'Failed to deactivate', 'error'),
        })
      }}
    />
  )
}
