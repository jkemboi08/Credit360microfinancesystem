import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  clickable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    variant = 'default',
    padding = 'md',
    hover = false,
    clickable = false,
    children,
    ...props
  }, ref) => {
    const baseClasses = [
      'card',
      'bg-white rounded-xl',
      'transition-all duration-200',
    ];

    const variantClasses = {
      default: [
        'border border-gray-200',
        'shadow-sm',
      ],
      elevated: [
        'border border-gray-200',
        'shadow-md',
      ],
      outlined: [
        'border-2 border-gray-300',
        'shadow-none',
      ],
      glass: [
        'glass backdrop-blur-md',
        'border border-white/20',
        'shadow-lg',
      ],
    };

    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    const interactionClasses = [
      hover && 'hover:shadow-lg hover:-translate-y-1',
      clickable && 'cursor-pointer hover:shadow-lg hover:-translate-y-1 active:translate-y-0',
    ];

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      interactionClasses,
      className
    );

    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components
export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('card-header px-6 py-4 border-b border-gray-200', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

export const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('card-body px-6 py-4', className)}
    {...props}
  />
));

CardBody.displayName = 'CardBody';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('card-footer px-6 py-4 border-t border-gray-200 bg-gray-50', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold text-gray-900', className)}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

export default Card;






























