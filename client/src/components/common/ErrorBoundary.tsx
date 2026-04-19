import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          {/* Tricolor strip */}
          <div className="flex overflow-hidden rounded-full mb-6" style={{ height: '4px', width: '96px' }}>
            <div className="flex-1" style={{ background: '#009A44' }} />
            <div className="flex-1" style={{ background: '#FDEF42' }} />
            <div className="flex-1" style={{ background: '#E31B23' }} />
          </div>
          <div
            className="flex items-center justify-center rounded-2xl mb-6 shadow-sm"
            style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #E31B23, #B81019)' }}
          >
            <AlertTriangle size={36} className="text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Oups, une erreur est survenue
          </h2>
          <p className="text-gray-500 mb-6 max-w-xs">
            Nous sommes désolés pour ce désagrément. Veuillez rafraîchir la page ou réessayer plus tard.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw size={16} /> Rafraîchir la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
