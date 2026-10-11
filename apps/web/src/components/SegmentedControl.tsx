import { cn } from '../lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

/** Segmented control estilo iOS (filtros de estado, etc.). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded-control bg-surface-2 p-1"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              onChange(option.value);
            }}
            className={cn(
              'min-h-9 rounded-[10px] px-3.5 text-sub font-medium transition',
              isActive
                ? 'bg-surface text-text shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                : 'text-text-secondary hover:text-text',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
