import type { InputHTMLAttributes, Ref } from 'react';
import { useId } from 'react';
import { cn } from '../lib/utils';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

export function TextInput({ label, error, className, id, ref, ...props }: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sub font-medium text-text-secondary">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'min-h-11 w-full rounded-control bg-surface-2 px-3.5 text-body text-text',
          'transition placeholder:text-text-secondary',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
