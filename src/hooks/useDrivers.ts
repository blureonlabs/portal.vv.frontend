import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import type { Driver } from '../types'

export function useDrivers(enabled = true) {
  return useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiGet('/drivers'),
    enabled,
  })
}

export function useActiveDrivers(enabled = true) {
  const query = useDrivers(enabled)
  const activeDrivers = (query.data ?? []).filter(d => d.is_active)
  return { ...query, data: activeDrivers }
}
