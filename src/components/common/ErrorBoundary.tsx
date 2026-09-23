import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ShieldAlert, Copy, Check } from 'lucide-react';
import { logSystemError } from '../../lib/errors.ts';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
  errorLogged: boolean;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      componentStack: null,
      errorLogged: false,
      showDetails: false,
      copied: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SchoolCore Global ErrorBoundary caught exception]:', error, errorInfo);
    this.setState({ componentStack: errorInfo.componentStack || null });

    // Traceability Patch: Direct logging to Supabase system_logs
    try {
      const schoolId = localStorage.getItem('schoolcore_school_id') || undefined;
      const userId = localStorage.getItem('schoolcore_user_id') || undefined;

      logSystemError({
        message: error.message || 'Unknown Application Error',
        stack: error.stack,
        componentStack: errorInfo.componentStack || undefined,
        schoolId,
        userId,
        level: 'FATAL',
      }).then(() => {
        this.setState({ errorLogged: true });
      }).catch((logErr) => {
        console.warn('Could not post error log to system_logs:', logErr);
      });
    } catch {
      // Local boundary protection
    }
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, componentStack: null });
    window.location.reload();
  };

  public handleCopyDiagnostic = () => {
    const diagnostic = `SchoolCore Error Log:
Time: ${new Date().toISOString()}
Message: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
ComponentStack: ${this.state.componentStack}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(diagnostic);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }
  };

  public override render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'An unexpected runtime issue occurred.';

      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center selection:bg-emerald-500 selection:text-white">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-lg w-full shadow-2xl text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100">
                  {this.props.fallbackTitle || 'Application Error Encountered'}
                </h1>
                <p className="text-xs text-slate-400">
                  Logged automatically to system audit logs
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              {this.props.fallbackMessage ||
                "SchoolCore encountered an issue while rendering this view. Your school records remain preserved and secure in the database."}
            </p>

            {this.state.errorLogged && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Stack trace and diagnostic recorded to Supabase system_logs.</span>
              </div>
            )}

            <div className="mb-6">
              <button
                type="button"
                id="error-boundary-toggle-details"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
              >
                <span>{this.state.showDetails ? 'Hide error details' : 'View error diagnostic'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${this.state.showDetails ? 'rotate-180' : ''}`} />
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto max-h-48">
                  <div className="text-rose-400 font-semibold mb-1">{errorMsg}</div>
                  {this.state.error?.stack && (
                    <pre className="text-[11px] text-slate-400 whitespace-pre-wrap leading-tight">
                      {this.state.error.stack.split('\n').slice(0, 8).join('\n')}
                    </pre>
                  )}
                  <div className="mt-3 pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      type="button"
                      id="error-boundary-copy-btn"
                      onClick={this.handleCopyDiagnostic}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      {this.state.copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{this.state.copied ? 'Copied' : 'Copy diagnostic'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                id="error-boundary-reload-btn"
                onClick={this.handleReset}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              <button
                id="error-boundary-back-btn"
                onClick={() => { window.location.href = '/'; }}
                className="w-full sm:w-auto py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
