import { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: undefined };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[AppErrorBoundary] Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{
          padding: '2rem',
          color: '#e11d48',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#111827',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h1 style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            color: '#ef4444'
          }}>
            앗! 화면을 그리는 중 문제가 발생했어요.
          </h1>
          <pre style={{
            whiteSpace: 'pre-wrap',
            backgroundColor: '#1f2937',
            padding: '1rem',
            borderRadius: '0.5rem',
            color: '#f87171',
            fontSize: '0.9rem',
            marginBottom: '2rem',
            maxWidth: '80vw',
            overflow: 'auto'
          }}>
            {String(this.state.error.message)}
          </pre>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a 
              href="/game"
              style={{
                padding: '0.8rem 1.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600'
              }}
            >
              게임 홈으로 이동
            </a>
            <a 
              href="/"
              style={{
                padding: '0.8rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600'
              }}
            >
              메인 화면으로
            </a>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.8rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              새로고침
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}