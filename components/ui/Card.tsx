import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  animate?: boolean;
}

const Card = ({ className, animate = false, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md',
        animate && 'hover:-translate-y-1',
        className
      )}
      {...props}
    />
  );
};

const CardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  );
};

const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3
      className={cn('text-lg font-semibold text-gray-900', className)}
      {...props}
    />
  );
};

const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p
      className={cn('text-sm text-gray-500', className)}
      {...props}
    />
  );
};

const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
};

const CardFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  );
};

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };