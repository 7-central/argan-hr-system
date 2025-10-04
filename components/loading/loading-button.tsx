'use client';

import { useLoadingState } from '@/lib/hooks/useLoadingState';

import { Button, type ButtonProps } from '@/components/ui/button';

interface LoadingButtonProps extends Omit<ButtonProps, 'loading' | 'onClick'> {
  onClick?: () => Promise<void> | void;
  loadingText?: string;
}

/**
 * Button component with built-in loading state management
 * Automatically handles loading state for async operations
 *
 * @example
 * ```tsx
 * <LoadingButton
 *   onClick={async () => {
 *     await submitForm()
 *   }}
 *   loadingText="Saving..."
 * >
 *   Save Client
 * </LoadingButton>
 * ```
 */
export function LoadingButton({
  onClick,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  const { isLoading, execute } = useLoadingState();

  const handleClick = async () => {
    if (!onClick) return;

    await execute(async () => {
      await onClick();
    });
  };

  return (
    <Button
      {...props}
      loading={isLoading}
      loadingText={loadingText}
      disabled={disabled || isLoading}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}
