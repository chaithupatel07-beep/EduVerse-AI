import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'An Error Occurred',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-3 ${className}`}>
      <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-bold text-red-900">{title}</p>
        <p className="mt-0.5 text-red-700 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-semibold text-[11px] transition"
          >
            <RefreshCw size={12} />
            <span>Retry Action</span>
          </button>
        )}
      </div>
    </div>
  );
};
