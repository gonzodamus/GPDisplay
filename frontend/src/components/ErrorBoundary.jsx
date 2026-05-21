import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={styles.fallback}>
          <span style={styles.label}>{this.props.name || 'widget error'}</span>
          <span style={styles.message}>{this.state.error.message}</span>
        </div>
      )
    }
    return this.props.children
  }
}

const styles = {
  fallback: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '6px',
    padding: '12px',
    border: '1px solid rgba(255,80,80,0.4)',
    borderRadius: '6px',
  },
  label: {
    fontSize: '0.75rem',
    color: 'rgba(255,100,100,0.9)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  message: {
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
}
