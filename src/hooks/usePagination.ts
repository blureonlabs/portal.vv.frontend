import { useState } from 'react'

export function usePagination(initialLimit = 25) {
  const [page, setPage] = useState(1)
  const limit = initialLimit
  const offset = (page - 1) * limit
  return { page, limit, offset, setPage }
}
