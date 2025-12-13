import React from 'react';
import { cn } from '@/utils/helpers';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
    xl: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          'animate-spin rounded-full border-primary-500 border-t-transparent',
          sizes[size],
          className
        )}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

// Full page loading
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <Spinner size="xl" />
      <p className="mt-4 text-sm text-gray-500">{message}</p>
    </div>
  );
};

// Skeleton loader
export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
}) => {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        variants[variant],
        variant === 'text' && 'h-4',
        className
      )}
      style={{ width, height }}
    />
  );
};

// Card skeleton
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </div>
      </div>
      <Skeleton height={100} variant="rectangular" />
      <div className="flex justify-between">
        <Skeleton width="30%" />
        <Skeleton width="20%" />
      </div>
    </div>
  );
};

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 flex gap-4 border-t border-gray-100">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Spinner;
