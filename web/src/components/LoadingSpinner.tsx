import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  size = 'md',
  fullPage = false,
}) => {
  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 36,
  }[size];

  const content = (
    <div className="flex flex-col items-center justify-center gap-2.5 text-slate-600">
      <Loader2 size={iconSizes} className="animate-spin text-blue-600" />
      {label && <p className="text-xs font-semibold">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        {content}
      </div>
    );
  }

  return <div className="py-8 flex items-center justify-center">{content}</div>;
};
