import { Component, ReactNode, ErrorInfo } from 'react';
import { Icon } from '../icons';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="aw-error-boundary-card card" role="alert">
          <div className="aw-error-boundary-header">
            <Icon name="warning" size={24} aria-hidden="true" />
            <h2 className="aw-error-title">Unable to display this view</h2>
          </div>
          <p className="aw-error-message">
            {this.props.fallbackMessage ||
              'A temporary display issue occurred while rendering this section.'}
          </p>
          {this.state.error && (
            <p className="aw-error-detail text-muted text-xs font-mono">
              {this.state.error.message}
            </p>
          )}
          <div className="aw-btn-row mt-4">
            <button
              type="button"
              className="aw-btn aw-btn-secondary"
              onClick={this.handleReset}
            >
              Try again
            </button>
            <button
              type="button"
              className="aw-btn aw-btn-primary"
              onClick={this.handleReload}
            >
              Reload this tab
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
