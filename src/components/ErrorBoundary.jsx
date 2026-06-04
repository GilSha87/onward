import React from 'react';
import { reportError } from '../lib/monitoring';

// App-level error boundary. Catches render-time crashes so a broken screen
// shows a recoverable message instead of a blank page, and forwards the error
// to the monitoring module.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    reportError(error, { componentStack: info?.componentStack, source: 'ErrorBoundary' });
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    // Per-client or custom error fallback: render prop receives { onReset }
    if (this.props.fallback) {
      return this.props.fallback({ onReset: () => this.setState({ hasError: false }) });
    }
    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          color: '#1A1714',
          background: '#FBF8F4',
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</div>
          <p style={{ marginTop: 8, fontSize: 14, opacity: 0.7, lineHeight: 1.5 }}>
            The page hit an unexpected error. Reloading usually fixes it. If it keeps
            happening, let the team know.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              marginTop: 16,
              padding: '10px 18px',
              borderRadius: 10,
              border: 'none',
              background: '#FB673E',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
