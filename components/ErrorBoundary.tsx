'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="m-6 rounded-card border border-[0.5px] border-border bg-surface p-6">
            <p className="text-sm font-medium text-danger">Une erreur est survenue</p>
            <p className="mt-2 text-sm text-text-secondary">{this.state.message}</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
