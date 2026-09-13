import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  appName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ApplicationErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ApplicationErrorBoundary Failure Isolated - ${this.props.appName}]:`, error, errorInfo);
    
    // Auto reload once if error is due to a stale dynamic chunk hash on Vercel redeployment
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed');

    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem('i3dion_boundary_chunk_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('i3dion_boundary_chunk_reload', 'true');
        window.location.reload();
      }
    }
  }

  private handleReset = () => {
    sessionStorage.removeItem('i3dion_boundary_chunk_reload');
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50/50 p-8 text-center shadow-xs">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-inner">
            <AlertTriangle size={28} />
          </div>
          <span className="text-xs uppercase tracking-widest font-extrabold text-rose-600">
            {this.props.appName} Application Boundary
          </span>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            An issue occurred inside {this.props.appName}
          </h2>
          <p className="mt-2 text-xs text-slate-600 max-w-md">
            This failure has been safely isolated. Other applications in the I3DION Spatial ecosystem remain fully operational.
          </p>

          {this.state.error && (
            <div className="mt-4 max-w-lg rounded-xl border border-rose-200 bg-white p-3 text-left font-mono text-[11px] text-rose-800 shadow-2xs overflow-x-auto">
              {this.state.error.message || 'Unknown runtime exception.'}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-sm transition active:scale-95"
            >
              <RefreshCw size={15} />
              Reload {this.props.appName}
            </button>
            <a
              href="/hub"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <ArrowLeft size={15} />
              Return to Spatial Hub
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
