import { Component } from 'react';

// Catches render errors anywhere below it so a single broken component
// shows a recoverable message instead of a blank white page.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erro de renderização:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h1 style={{ marginBottom: '0.75rem' }}>Algo correu mal 😵</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Ocorreu um erro inesperado. Tenta recarregar a página.
          </p>
          <button
            className="btn-primary"
            style={{ width: 'auto' }}
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
