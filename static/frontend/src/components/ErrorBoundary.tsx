import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ANDON ErrorBoundary caught error]:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="screen-container">
          <div
            style={{
              background: '#fff5f5',
              border: '1px solid #ffd5cc',
              borderLeft: '5px solid #de350b',
              borderRadius: '8px',
              padding: '24px',
              marginTop: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', color: '#bf2600', fontSize: '16px' }}>
              ⚠️ {this.props.fallbackTitle || 'Component Error Occurred'}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#172b4d' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
            </p>
            <button
              className="btn btn-primary"
              onClick={this.handleReset}
              style={{ fontSize: '13px' }}
            >
              🔄 Return to Change Lens
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
