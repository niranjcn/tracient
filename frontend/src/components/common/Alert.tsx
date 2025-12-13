import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/helpers';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}) => {
  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="h-5 w-5 text-blue-500" />,
    },
    success: {
      container: 'bg-success-50 border-success-200 text-success-800',
      icon: <CheckCircle className="h-5 w-5 text-success-500" />,
    },
    warning: {
      container: 'bg-warning-50 border-warning-200 text-warning-800',
      icon: <AlertTriangle className="h-5 w-5 text-warning-500" />,
    },
    error: {
      container: 'bg-error-50 border-error-200 text-error-800',
      icon: <AlertCircle className="h-5 w-5 text-error-500" />,
    },
  };

  const style = variants[variant];

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        style.container,
        className
      )}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">{style.icon}</div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <div className={cn('text-sm', title && 'mt-1')}>{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-black/5 focus:outline-none"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
