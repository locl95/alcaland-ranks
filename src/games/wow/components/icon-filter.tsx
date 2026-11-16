import './icon-filter.css';

interface IconFilterProps {
  label: string;
  options: string[];
  /** The option's icon; an option without one shows its first letters. */
  iconOf: (option: string) => string | undefined;
  value: string;
  onChange: (value: string) => void;
}

/**
 * An icon per option, as the LoL ladder filters by position: clicking the picked one again
 * clears it. With a single option there is nothing to filter, so it hides.
 */
export function IconFilter({ label, options, iconOf, value, onChange }: Readonly<IconFilterProps>) {
  if (options.length < 2) return null;

  return (
    <div className="ladder-icon-filter" role="group" aria-label={label}>
      {options.map((option) => {
        const icon = iconOf(option);
        return (
          <button
            key={option}
            type="button"
            className="ladder-icon-btn"
            aria-pressed={value === option}
            aria-label={option}
            title={option}
            onClick={() => onChange(value === option ? '' : option)}
          >
            {icon ? <img src={icon} alt="" aria-hidden={true} /> : option.slice(0, 2)}
          </button>
        );
      })}
    </div>
  );
}
