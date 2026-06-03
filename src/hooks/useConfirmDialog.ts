import { useState, useCallback } from 'react'

interface ConfirmState {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const confirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setState({ open: true, title, message, onConfirm })
  }, [])

  const close = useCallback(() => {
    setState(s => ({ ...s, open: false }))
  }, [])

  return { ...state, confirm, close }
}
