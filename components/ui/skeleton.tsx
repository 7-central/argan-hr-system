import { cn } from '@/lib/utils/cn';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

/**
 * Enhanced skeleton variants for common UI patterns
 */

/**
 * Text skeleton for single line text content
 */
function SkeletonText({ className, ...props }: React.ComponentProps<'div'>) {
  return <Skeleton className={cn('h-4 w-full max-w-[200px]', className)} {...props} />;
}

/**
 * Heading skeleton for page titles and section headers
 */
function SkeletonHeading({ className, ...props }: React.ComponentProps<'div'>) {
  return <Skeleton className={cn('h-6 w-full max-w-[300px]', className)} {...props} />;
}

/**
 * Avatar skeleton for user profile images
 */
function SkeletonAvatar({ className, ...props }: React.ComponentProps<'div'>) {
  return <Skeleton className={cn('h-10 w-10 rounded-full', className)} {...props} />;
}

/**
 * Button skeleton for action buttons
 */
function SkeletonButton({ className, ...props }: React.ComponentProps<'div'>) {
  return <Skeleton className={cn('h-10 w-24 rounded-md', className)} {...props} />;
}

/**
 * Badge skeleton for status indicators
 */
function SkeletonBadge({ className, ...props }: React.ComponentProps<'div'>) {
  return <Skeleton className={cn('h-5 w-16 rounded-full', className)} {...props} />;
}

export { Skeleton, SkeletonText, SkeletonHeading, SkeletonAvatar, SkeletonButton, SkeletonBadge };
