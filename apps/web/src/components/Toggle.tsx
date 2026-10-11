import { cn } from '../lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}

/** Interruptor estilo iOS. */
export function Toggle({ checked, onChange, disabled = false, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        onChange(!checked);
      }}
      className={cn(
        'relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full transition',
        checked ? 'bg-success' : 'bg-separator',
        'disabled:pointer-events-none disabled:opacity-50',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0.5 size-[27px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}
