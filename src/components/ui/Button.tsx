import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = [
      'btn',
      'inline-flex items-center justify-center gap-2',
      'font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'touch-target', // Ensures 44px minimum touch target
    ];

    const variantClasses = {
      primary: [
        'bg-primary-600 text-white border-primary-600',
        'hover:bg-primary-700 hover:border-primary-700',
        'focus:ring-primary-500',
        'active:bg-primary-800',
      ],
      secondary: [
        'bg-gray-100 text-gray-900 border-gray-300',
        'hover:bg-gray-200 hover:border-gray-400',
        'focus:ring-gray-500',
        'active:bg-gray-300',
      ],
      success: [
        'bg-success-600 text-white border-success-600',
        'hover:bg-success-700 hover:border-success-700',
        'focus:ring-success-500',
        'active:bg-success-800',
      ],
      warning: [
        'bg-warning-600 text-white border-warning-600',
        'hover:bg-warning-700 hover:border-warning-700',
        'focus:ring-warning-500',
        'active:bg-warning-800',
      ],
      error: [
        'bg-error-600 text-white border-error-600',
        'hover:bg-error-700 hover:border-error-700',
        'focus:ring-error-500',
        'active:bg-error-800',
      ],
      outline: [
        'bg-transparent text-primary-600 border-primary-600',
        'hover:bg-primary-600 hover:text-white',
        'focus:ring-primary-500',
        'active:bg-primary-700',
      ],
      ghost: [
        'bg-transparent text-gray-600 border-transparent',
        'hover:bg-gray-100 hover:text-gray-900',
        'focus:ring-gray-500',
        'active:bg-gray-200',
      ],
    };

    const sizeClasses = {
      sm: [
        'px-3 py-2 text-sm',
        'min-h-[36px] min-w-[36px]',
        'rounded-lg',
      ],
      md: [
        'px-4 py-3 text-sm',
        'min-h-[44px] min-w-[44px]',
        'rounded-lg',
      ],
      lg: [
        'px-6 py-4 text-base',
        'min-h-[52px] min-w-[52px]',
        'rounded-xl',
      ],
      xl: [
        'px-8 py-5 text-lg',
        'min-h-[60px] min-w-[60px]',
        'rounded-xl',
      ],
    };

    const widthClasses = fullWidth ? 'w-full' : '';

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      widthClasses,
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children && <span className="flex-1">{children}</span>}
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;






























