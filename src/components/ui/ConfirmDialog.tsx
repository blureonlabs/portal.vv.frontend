import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="relative bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-6"
          >
            {/* Icon + Title */}
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                variant === 'danger' ? 'bg-red-50' : 'bg-accent-light'
              }`}>
                <span className={`material-symbols-rounded text-[22px] ${
                  variant === 'danger' ? 'text-danger' : 'text-accent'
                }`}>
                  {variant === 'danger' ? 'warning' : 'info'}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-primary leading-snug">{title}</h3>
                <p className="text-sm text-muted mt-1 leading-relaxed">{message}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-5">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onCancel}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={variant === 'danger' ? 'danger' : 'primary'}
                className="flex-1"
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
