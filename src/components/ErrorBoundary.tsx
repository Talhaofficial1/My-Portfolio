import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Handled gracefully by friendly fallback UI without crashing the page
  }

  handleRecover = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-2xl border border-violet-500/25 bg-[#0d0917]/95 p-8 text-center"
        >
          <p className="text-sm font-medium text-white/85">
            {this.props.fallbackMessage || 'This project preview is unavailable right now.'}
          </p>
          <button
            type="button"
            onClick={this.handleRecover}
            className="mt-4 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:border-violet-400/50 hover:text-white"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
