'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="bg-dead-surface border border-red-900/50 p-6 font-mono" role="alert">
          <div className="text-red-500 text-sm mb-2">[ RENDER ERROR ]</div>
          <p className="text-dead-dim text-xs mb-4">
            Something went wrong displaying this section.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-xs text-dead-accent hover:text-dead-text border border-dead-border px-3 py-1 transition-colors"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
