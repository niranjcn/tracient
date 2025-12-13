import React from 'react';
import { cn } from '@/utils/helpers';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-700',
    error: 'bg-error-50 text-error-700',
    gray: 'bg-gray-100 text-gray-600',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const dotColors = {
    default: 'bg-gray-500',
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    gray: 'bg-gray-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
};

// Status Badge with predefined colors
export interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'primary' | 'gray'> = {
  active: 'success',
  verified: 'success',
  completed: 'success',
  running: 'success',
  healthy: 'success',
  connected: 'success',
  resolved: 'success',
  pending: 'warning',
  investigating: 'warning',
  degraded: 'warning',
  inactive: 'gray',
  suspended: 'error',
  stopped: 'error',
  error: 'error',
  failed: 'error',
  down: 'error',
  disconnected: 'error',
  new: 'primary',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const variant = statusVariants[status.toLowerCase()] || 'gray';
  return (
    <Badge variant={variant} dot className={className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

// Severity Badge
export interface SeverityBadgeProps {
  severity: 'low' | 'medium' | 'high';
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className }) => {
  const variants = {
    low: 'primary',
    medium: 'warning',
    high: 'error',
  } as const;

  return (
    <Badge variant={variants[severity]} className={className}>
      {severity.toUpperCase()}
    </Badge>
  );
};

// BPL/APL Badge
export interface BPLBadgeProps {
  classification?: 'BPL' | 'APL';
  status?: 'eligible' | 'not_eligible' | 'pending' | 'BPL' | 'APL';
  showLabel?: boolean;
  className?: string;
}

export const BPLBadge: React.FC<BPLBadgeProps> = ({ classification, status, showLabel, className }) => {
  // Determine if BPL based on either prop
  const isBPL = classification === 'BPL' || status === 'eligible' || status === 'BPL';
  const isPending = status === 'pending';
  
  let displayText: string;
  let colorClass: string;
  
  if (isPending) {
    displayText = showLabel ? 'Status Pending' : 'Pending';
    colorClass = 'bg-yellow-100 text-yellow-700';
  } else if (isBPL) {
    displayText = showLabel ? 'BPL Eligible' : 'BPL';
    colorClass = 'bg-red-100 text-red-700';
  } else {
    displayText = showLabel ? 'APL Status' : 'APL';
    colorClass = 'bg-green-100 text-green-700';
  }
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold',
        colorClass,
        className
      )}
    >
      {displayText}
    </span>
  );
};

export default Badge;
