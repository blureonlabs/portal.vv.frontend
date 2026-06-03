import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api'

export function useConfigTable<T = unknown>(endpoint: string) {
  const qc = useQueryClient()
  const queryKey = ['config', endpoint]

  const list = useQuery<T[]>({
    queryKey,
    queryFn: () => apiGet(`/config/${endpoint}`),
  })

  const create = useMutation({
    mutationFn: (data: Record<string, string>) => apiPost(`/config/${endpoint}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  const update = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiPut(`/config/${endpoint}/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/config/${endpoint}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  return { list, create, update, remove }
}
