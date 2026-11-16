import { Search } from 'lucide-react';
import '@/features/views/components/shared/form-controls.css';
import './ladder-search.css';

interface LadderSearchProps {
  value: string;
  onChange: (value: string) => void;
}

/** Filters a Warcraft ladder by character name. */
export function LadderSearch({ value, onChange }: Readonly<LadderSearchProps>) {
  return (
    <label className="ladder-search">
      <Search className="ladder-search-icon" aria-hidden={true} />
      <input
        className="form-input"
        type="search"
        placeholder="Search character"
        aria-label="Search character"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
