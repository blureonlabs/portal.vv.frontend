import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api'
import type { Platform } from '../types'

export function usePlatforms() {
  return useQuery<Platform[]>({
    queryKey: ['platforms'],
    queryFn: () => apiGet('/platforms'),
  })
}

export function useCreatePlatform() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; code: string }) => apiPost('/platforms', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platforms'] }),
  })
}

export function useUpdatePlatform() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; is_active: boolean; sort_order: number }) =>
      apiPut(`/platforms/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platforms'] }),
  })
}

export function useDeactivatePlatform() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/platforms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platforms'] }),
  })
}
