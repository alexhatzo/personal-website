import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full h-dvh bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl max-w-md w-full p-8 shadow-2xl shadow-black/50 text-center">
            <div className="text-5xl mb-4">💥</div>
            <h1 className="text-xl font-bold text-white mb-3 pixel-text">
              Oops! Something went wrong
            </h1>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              The app encountered an unexpected error. Don't worry, you can try
              again!
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-slate-500 text-xs cursor-pointer hover:text-slate-400 transition-colors">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 bg-slate-900/50 rounded-lg text-xs text-red-400 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
