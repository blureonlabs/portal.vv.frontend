import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="flex flex-col items-center gap-6 text-center max-w-sm px-6">
            <span
              className="material-symbols-outlined text-danger"
              style={{ fontSize: '64px' }}
            >
              error
            </span>
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-semibold text-primary">
                Something went wrong
              </h1>
              <p className="text-sm text-muted">
                An unexpected error occurred. Please reload the page and try again.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-200 bg-primary text-white hover:bg-primary/90 active:bg-primary/80 shadow-sm hover:shadow-md h-10 px-5 text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
