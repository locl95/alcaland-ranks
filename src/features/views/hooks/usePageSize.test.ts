import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { usePageSize } from './usePageSize.ts';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('usePageSize', () => {
  it('starts at 10 rows, offering the sizes the ladder can use', () => {
    const { result } = renderHook(() => usePageSize(40));

    expect(result.current.size).toBe(10);
    expect(result.current.rowsPerPage).toBe(10);
    expect(result.current.options).toEqual([10, 25, 'all']);
  });

  it('remembers the pick for the next ladder opened', () => {
    const { result } = renderHook(() => usePageSize(40));
    act(() => result.current.pick('all'));
    expect(result.current.rowsPerPage).toBe(40);

    const next = renderHook(() => usePageSize(60));
    expect(next.result.current.size).toBe('all');
  });

  it('resolves the remembered pick for a ladder too long to show whole', () => {
    localStorage.setItem('ladder-page-size', 'all');

    const { result } = renderHook(() => usePageSize(300));

    expect(result.current.size).toBe(50);
  });

  it('ignores a stored value that is not a size', () => {
    localStorage.setItem('ladder-page-size', '7');

    expect(renderHook(() => usePageSize(40)).result.current.size).toBe(10);
  });

  it('still applies a pick when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => usePageSize(40));

    act(() => result.current.pick(25));

    expect(result.current.size).toBe(25);
  });
});
