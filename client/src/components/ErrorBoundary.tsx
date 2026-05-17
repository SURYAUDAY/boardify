import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

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

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-[18px] font-semibold text-[#1E293B] text-center">
            Something went wrong — your work is saved
          </h2>
          {this.state.error?.message && (
            <p className="text-[13px] text-gray-500 text-center mt-2">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full mt-6 bg-indigo-500 hover:bg-indigo-600 text-white text-[14px] font-semibold h-10 rounded-xl"
          >
            Reload board
          </button>
        </div>
      </div>
    );
  }
}
