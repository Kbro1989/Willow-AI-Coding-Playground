import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
    onCatch?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("[CRITICAL] Uncaught error:", error, errorInfo);
        if (this.props.onCatch) {
            this.props.onCatch(error, errorInfo);
        }
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="fixed inset-0 flex flex-col items-center justify-center h-screen w-screen bg-[#050a15]/60 backdrop-blur-sm text-white p-10 font-sans z-[9999] pointer-events-none">
                    <div className="bg-red-950/90 border border-red-500/30 p-10 rounded-3xl max-w-2xl w-full shadow-2xl pointer-events-auto">
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-red-500 mb-6 flex items-center">
                            <svg className="w-10 h-10 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Neural Overwatch Failure
                        </h1>
                        <p className="text-slate-400 mb-8 font-medium">The engine encountered a fatal runtime exception. System halted for protection.</p>
                        <div className="bg-black/40 rounded-2xl p-6 font-mono text-xs text-red-400 overflow-auto max-h-64 border border-red-500/10 mb-8">
                            <div className="font-bold mb-2">EXCEPTION_ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
                            {this.state.error?.stack || this.state.error?.message}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                        >
                            Reboot Neural Interface
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
