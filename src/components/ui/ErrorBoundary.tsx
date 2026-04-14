import React, { Component, ErrorInfo, ReactNode } from 'react';
import { CircleAlert as AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-64 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-danger-500" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">Something went wrong</h3>
          <p className="text-sm text-neutral-400 mb-5 max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred in this component.'}
          </p>
          <button
            onClick={this.reset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
