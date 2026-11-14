import './create-mode-toggle.css';

export type CreateMode = 'characters' | 'guild';

interface CreateModeToggleProps {
  mode: CreateMode;
  onSelect: (mode: CreateMode) => void;
}

const MODES: { value: CreateMode; label: string }[] = [
  { value: 'characters', label: 'Characters' },
  { value: 'guild', label: 'Guild' },
];

/** Whether a new Warcraft ladder is built from characters or follows a whole guild. */
export function CreateModeToggle({ mode, onSelect }: Readonly<CreateModeToggleProps>) {
  return (
    <div className="create-mode-toggle" role="group" aria-label="Ladder contents">
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={`create-mode-btn${mode === value ? ' create-mode-btn--active' : ''}`}
          aria-pressed={mode === value}
          onClick={() => onSelect(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
