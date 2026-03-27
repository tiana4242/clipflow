import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log detailed error info for debugging
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="max-w-md w-full text-center">
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
              <div className="mb-4">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">⚠️</span>
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
              
              <div className="text-slate-400 mb-4">
                <p className="mb-2">The application encountered an unexpected error.</p>
                {this.state.error && (
                  <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-300 mb-2">
                      <strong>Error Details:</strong>
                    </p>
                    <code className="block text-xs text-red-400 bg-slate-900 p-2 rounded overflow-auto max-h-32">
                      {this.state.error.message}
                    </code>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Reload Page
                </button>
                
                <button
                  onClick={() => this.setState({ hasError: false, error: undefined })}
                  className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
