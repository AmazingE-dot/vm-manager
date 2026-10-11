import { ChevronDown } from 'lucide-react';
import type { Ref, SelectHTMLAttributes } from 'react';
import { useId } from 'react';
import { cn } from '../lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: SelectOption[];
  ref?: Ref<HTMLSelectElement>;
}

export function Select({ label, error, options, className, id, ref, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sub font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'min-h-11 w-full appearance-none rounded-control bg-surface-2 px-3.5 pr-10 text-body text-text transition',
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          strokeWidth={1.75}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-secondary"
        />
      </div>
      {error ? (
        <p id={errorId} className="text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
