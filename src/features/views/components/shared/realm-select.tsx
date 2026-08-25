import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
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

const GAP = 4;

type ListPosition = { left: number; width: number; top?: number; bottom?: number };

export function RealmSelect({
  region,
  realm,
  onRegionChange,
  onRealmChange,
}: Readonly<RealmSelectProps>) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<ListPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const listId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const realms = region === 'us' ? NA_REALMS : EU_REALMS;
  const selectedLabel = realms.find((r) => r.slug === realm)?.label ?? '';
  const matches = useMemo(() => matchRealms(realms, query), [realms, query]);

  const close = () => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  };

  const openList = () => {
    setIsOpen(true);
    setActiveIndex(0);
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
    const listHeight = listRef.current?.offsetHeight ?? 0;
    const openUpwards = spaceBelow < listHeight && rect.top > spaceBelow;

    setPosition({
      left: rect.left,
      width: rect.width,
      ...(openUpwards
        ? { bottom: window.innerHeight - rect.top + GAP }
        : { top: rect.bottom + GAP }),
    });
  }, []);

  const frameRef = useRef<number | null>(null);
  const scheduleUpdate = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      updatePosition();
    });
  }, [updatePosition]);

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
    else setPosition(null);
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('scroll', scheduleUpdate, { capture: true, passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('scroll', scheduleUpdate, true);
      window.removeEventListener('resize', scheduleUpdate);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [isOpen, scheduleUpdate]);

  useEffect(() => {
    if (!isOpen) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isOpen) return;
      e.stopPropagation();
      const option = matches[activeIndex];
      if (option) selectRealm(option.slug);
      return;
    }

    if (e.key === 'Escape') {
      if (!isOpen) return;
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        openList();
        return;
      }
      if (matches.length === 0) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => (i + step + matches.length) % matches.length);
      return;
    }

    if (e.key === 'Tab' && isOpen) close();
  };

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
          aria-controls={listId}
          aria-activedescendant={isOpen && matches.length > 0 ? optionId(activeIndex) : undefined}
          autoComplete="off"
          placeholder="Realm"
          value={isOpen ? query : selectedLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={openList}
          onKeyDown={handleKeyDown}
        />

        {isOpen && (
          <ul
            ref={listRef}
            className="realm-options"
            id={listId}
            role="listbox"
            style={position ?? undefined}
          >
            {matches.length === 0 ? (
              <li className="realm-option realm-option--empty">No realms found</li>
            ) : (
              matches.map((option, index) => (
                <li
                  key={option.slug}
                  id={optionId(index)}
                  role="option"
                  aria-selected={option.slug === realm}
                  className={`realm-option${index === activeIndex ? ' realm-option--active' : ''}`}
                  onClick={() => selectRealm(option.slug)}
                  onMouseEnter={() => setActiveIndex(index)}
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
