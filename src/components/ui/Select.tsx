import { cn } from '../../lib/utils'
import { forwardRef, useState, useRef, useEffect, type SelectHTMLAttributes } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  error?: string
  options?: { value: string; label: string }[]
  onChange?: (e: { target: { value: string; name?: string } }) => void
  value?: string
  name?: string
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, children, onChange, value, name, placeholder = 'Select...', disabled, ...props }, ref) => {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // If using children (native <option>) fallback to native select
    if (!options) {
      return (
        <div className="flex flex-col gap-1.5">
          {label && (
            <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-muted">
              {label}
            </label>
          )}
          <select
            ref={ref}
            id={id}
            name={name}
            value={value}
            onChange={onChange as any}
            disabled={disabled}
            className={cn(
              'h-10 w-full rounded-xl border border-border bg-white px-4 text-sm text-primary',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30',
              'disabled:bg-surface disabled:cursor-not-allowed',
              'transition-all duration-200',
              error && 'border-danger',
              className
            )}
            {...props}
          >
            {children}
          </select>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      )
    }

    const selected = options.find((o) => o.value === value)

    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const handleSelect = (val: string) => {
      onChange?.({ target: { value: val, name } })
      setOpen(false)
    }

    return (
      <div className="flex flex-col gap-1.5" ref={containerRef}>
        {/* Hidden native select for form compatibility */}
        <select ref={ref} name={name} value={value} onChange={() => {}} className="sr-only" tabIndex={-1} {...props}>
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-muted">
            {label}
          </label>
        )}

        {/* Custom trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={cn(
            'h-10 w-full rounded-xl border border-border bg-white px-4 text-sm text-left flex items-center justify-between',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30',
            'disabled:bg-surface disabled:cursor-not-allowed',
            'transition-all duration-200',
            open && 'ring-2 ring-primary/20 border-primary/30',
            error && 'border-danger',
            className
          )}
        >
          <span className={selected ? 'text-primary' : 'text-muted/60'}>
            {selected?.label || placeholder}
          </span>
          <span className="material-symbols-rounded text-[18px] text-muted transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>
            expand_more
          </span>
        </button>

        {/* Dropdown */}
        <div className="relative">
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-0 left-0 right-0 z-50 bg-white border border-border rounded-xl shadow-lg py-1 max-h-56 overflow-y-auto"
              >
                {options.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => handleSelect(o.value)}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between',
                      o.value === value
                        ? 'bg-primary/5 text-primary font-medium'
                        : 'text-primary/80 hover:bg-surface'
                    )}
                  >
                    {o.label}
                    {o.value === value && (
                      <span className="material-symbols-rounded text-[18px] text-primary">check</span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export { Select }
