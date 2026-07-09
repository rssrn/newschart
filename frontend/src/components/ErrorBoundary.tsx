// @author Claude Sonnet 5 Anthropic
import React from 'react';
import { reportError } from '../utils/ferrtrap';
import { track } from '../utils/analytics';

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    reportError(error.name, error.message);
    track('frontend_error', { errorType: error.name });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#94a3b8', fontFamily: 'system-ui, sans-serif' }}
        >
          Something went wrong. Please refresh the page.
        </div>
      );
    }
    return this.props.children;
  }
}
