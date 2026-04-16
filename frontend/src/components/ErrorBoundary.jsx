import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Crash:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#08090C] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full glass-card p-8 border-brand-danger/20">
            <div className="w-16 h-16 rounded-full bg-brand-danger/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-brand-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-display font-bold text-brand-text mb-4">Application Crash</h1>
            <p className="text-brand-text-muted mb-6 text-sm leading-relaxed">
              We encountered an unexpected error. This has been logged and we're looking into it.
            </p>
            <div className="bg-brand-dark/50 rounded-lg p-4 mb-6 text-left overflow-hidden">
              <p className="text-[10px] text-brand-text-dim uppercase font-bold mb-2">Error Details</p>
              <p className="text-xs text-brand-danger font-mono break-words">
                {this.state.error?.message || 'Unknown runtime error'}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="gold-button w-full"
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
