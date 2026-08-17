import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EU_REALMS, RealmOption } from '@/features/views/constants/euRealms.ts';
import { NA_REALMS } from '@/features/views/constants/naRealms.ts';
import './realm-select.css';

interface RealmSelectProps {
  region: string;
  realm: string;
  onRegionChange: (region: string) => void;
  onRealmChange: (realm: string) => void;
}

function matchRealms(realms: RealmOption[], query: string): RealmOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return realms;

  const prefix: RealmOption[] = [];
  const contains: RealmOption[] = [];
  for (const realm of realms) {
    const label = realm.label.toLowerCase();
    if (label.startsWith(q)) prefix.push(realm);
    else if (label.includes(q)) contains.push(realm);
  }
  return [...prefix, ...contains];
}

const MAX_LIST_HEIGHT = 192;
const GAP = 4;

type ListPosition = {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
};

export function RealmSelect({
  region,
  realm,
  onRegionChange,
  onRealmChange,
}: Readonly<RealmSelectProps>) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ListPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const realms = region === 'us' ? NA_REALMS : EU_REALMS;
  const selectedLabel = realms.find((r) => r.slug === realm)?.label ?? '';
  const matches = useMemo(() => matchRealms(realms, query), [realms, query]);

  const close = () => {
    setIsOpen(false);
    setQuery('');
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onRegionChange(e.target.value);
    onRealmChange('');
    close();
  };

  const selectRealm = (slug: string) => {
    onRealmChange(slug);
    close();
  };

  const updatePosition = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    const rect = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < MAX_LIST_HEIGHT && rect.top > spaceBelow;

    setPosition({
      left: rect.left,
      width: rect.width,
      maxHeight: MAX_LIST_HEIGHT,
      ...(openUpwards
        ? { bottom: window.innerHeight - rect.top + GAP }
        : { top: rect.bottom + GAP }),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handlePointerDown);

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  return (
    <>
      <select
        className="form-select form-select-region"
        value={region}
        onChange={handleRegionChange}
        aria-label="Region"
      >
        <option value="eu">EU</option>
        <option value="us">NA</option>
      </select>

      <div className="realm-combobox" ref={containerRef}>
        <input
          ref={inputRef}
          className="form-input realm-combobox-input"
          type="text"
          role="combobox"
          aria-label="Realm"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="realm-listbox"
          autoComplete="off"
          placeholder="Realm"
          value={isOpen ? query : selectedLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
        />

        {isOpen && (
          <ul
            className="realm-options"
            id="realm-listbox"
            role="listbox"
            style={{ maxHeight: MAX_LIST_HEIGHT, ...position }}
          >
            {matches.length === 0 ? (
              <li className="realm-option realm-option--empty">No realms found</li>
            ) : (
              matches.map((option) => (
                <li
                  key={option.slug}
                  role="option"
                  aria-selected={option.slug === realm}
                  className="realm-option"
                  onClick={() => selectRealm(option.slug)}
                >
                  {option.label}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </>
  );
}
