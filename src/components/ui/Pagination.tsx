interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="Go to previous page"
      >
        <span className="material-symbols-rounded text-[18px]">chevron_left</span>
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-sm text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            aria-current={p === page ? 'page' : undefined}
            className={`w-10 h-10 rounded-full text-sm font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/30 ${
              p === page
                ? 'bg-primary text-white'
                : 'text-muted hover:text-primary hover:bg-surface'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="Go to next page"
      >
        <span className="material-symbols-rounded text-[18px]">chevron_right</span>
      </button>
    </div>
  )
}
