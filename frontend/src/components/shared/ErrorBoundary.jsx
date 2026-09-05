import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown failure' };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="onboarding-root" role="alert">
          <div className="onboarding-panel glass-panel text-center fade-in" style={{ maxWidth: '480px' }}>
            <ShieldAlert size={40} className="neon-red" style={{ margin: '0 auto 12px' }} />
            <h2 className="font-sans" style={{ marginBottom: '8px' }}>Ecosystem Render Failure</h2>
            <p className="font-mono text-sm" style={{ color: 'var(--text-dim)', marginBottom: '20px', wordBreak: 'break-word' }}>
              {this.state.message}
            </p>
            <button onClick={this.handleReset} className="neon-btn accent font-sans w-full">
              <RefreshCw size={14} /> Reinitialize Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}