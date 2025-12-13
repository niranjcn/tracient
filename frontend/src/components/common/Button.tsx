import React from 'react';
import { cn } from '@/utils/helpers';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    leftIcon, 
    rightIcon, 
    children, 
    disabled,
    ...props 
  }, ref) => {
    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-500',
      success: 'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus:ring-success-500',
      danger: 'bg-error-500 text-white hover:bg-error-600 active:bg-error-700 focus:ring-error-500',
      outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500',
      ghost: 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
