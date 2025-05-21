import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-600',
        secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-600',
        outline: 'border border-gray-200 bg-white hover:bg-gray-100 text-gray-900',
        ghost: 'hover:bg-gray-100 text-gray-900',
        link: 'underline-offset-4 hover:underline text-primary-600',
        danger: 'bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-600',
        success: 'bg-success-600 text-white hover:bg-success-700 focus-visible:ring-success-600',
        warning: 'bg-warning-600 text-white hover:bg-warning-700 focus-visible:ring-warning-600',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };