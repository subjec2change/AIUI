import React, { Component } from 'react';
import type { ErrorBoundaryProps, ErrorBoundaryState } from '../types';

const defaultStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#000',
    color: '#ff6b6b',
    fontFamily: 'system-ui, sans-serif',
    padding: '2rem',
    textAlign: 'center',
};

const buttonStyle: React.CSSProperties = {
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#27eab6',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleRestart = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={defaultStyles}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
                    <p style={{ fontSize: '0.875rem', color: '#aaa', maxWidth: '500px' }}>
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <button style={buttonStyle} onClick={this.handleRestart}>
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
