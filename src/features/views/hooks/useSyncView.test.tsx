import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSyncView } from './useSyncView.ts';
import { viewKeys } from '@/features/views/api/viewQueries.ts';

const mockCreateSyncTask = vi.fn();
const mockPollSyncTask = vi.fn();

vi.mock('@/features/views/api/taskApi', () => ({
  createSyncTask: (...args: unknown[]) => mockCreateSyncTask(...args),
  pollSyncTask: (...args: unknown[]) => mockPollSyncTask(...args),
}));

const VIEW_ID = '11111111-1111-1111-1111-111111111111';
const COOLDOWN_KEY = `alcaland:cooldown:${VIEW_ID}`;
const LAST_SYNCED_KEY = `alcaland:lastSyncedAt:${VIEW_ID}`;

const makeTask = (
  status: 'SUCCESSFUL' | 'ERROR',
  { message = '', retryAfter = null }: { message?: string; retryAfter?: string | null } = {},
) => ({
  id: 'task-1',
  type: 'CACHE_GAME_VIEW_DATA_TASK',
  taskStatus: { status, message, retryAfter },
  inserted: new Date().toISOString(),
});

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
};

describe('useSyncView', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------

  it('reads lastSyncedAt from localStorage on init', () => {
    const ts = '2026-01-01T00:00:00.000Z';
    localStorage.setItem(LAST_SYNCED_KEY, ts);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    expect(result.current.lastSyncedAt).toBe(ts);
  });

  it('is disabled and shows a countdown when an active cooldown is stored', () => {
    const future = new Date(Date.now() + 90_000).toISOString();
    localStorage.setItem(COOLDOWN_KEY, future);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    expect(result.current.isDisabled).toBe(true);
    expect(result.current.countdownLabel).toMatch(/\d/);
  });

  it('ignores an expired cooldown stored in localStorage', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    localStorage.setItem(COOLDOWN_KEY, past);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    expect(result.current.isDisabled).toBe(false);
    expect(result.current.countdownLabel).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // triggerSync no-ops
  // ---------------------------------------------------------------------------

  it('triggerSync is a no-op when viewId is undefined', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSyncView(undefined), { wrapper });
    await act(async () => {
      result.current.triggerSync();
    });
    expect(mockCreateSyncTask).not.toHaveBeenCalled();
  });

  it('triggerSync is a no-op when an active cooldown is stored', async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    localStorage.setItem(COOLDOWN_KEY, future);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    await act(async () => {
      result.current.triggerSync();
    });
    expect(mockCreateSyncTask).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // In-flight state
  // ---------------------------------------------------------------------------

  it('sets isRunning to true and disables the button while the task is in-flight', async () => {
    let resolveCreate!: (v: { id: string }) => void;
    mockCreateSyncTask.mockReturnValue(new Promise((r) => (resolveCreate = r)));
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    act(() => {
      void result.current.triggerSync();
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.isDisabled).toBe(true);

    // Resolve to let the hook clean up
    mockPollSyncTask.mockResolvedValue(makeTask('SUCCESSFUL'));
    await act(async () => {
      resolveCreate({ id: 'task-1' });
    });
  });

  it('does not start a second sync while one is already running', async () => {
    let resolveCreate!: (v: { id: string }) => void;
    mockCreateSyncTask.mockReturnValue(new Promise((r) => (resolveCreate = r)));
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    act(() => {
      void result.current.triggerSync();
    });

    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      result.current.triggerSync();
    });

    expect(mockCreateSyncTask).toHaveBeenCalledTimes(1);

    // Clean up
    mockPollSyncTask.mockResolvedValue(makeTask('SUCCESSFUL'));
    await act(async () => {
      resolveCreate({ id: 'task-1' });
    });
  });

  // ---------------------------------------------------------------------------
  // Successful sync
  // ---------------------------------------------------------------------------

  it('sets statusMessage to "Synced successfully" on success without retryAfter', async () => {
    mockCreateSyncTask.mockResolvedValue({ id: 'task-1' });
    mockPollSyncTask.mockResolvedValue(makeTask('SUCCESSFUL'));
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    await act(async () => {
      result.current.triggerSync();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.statusMessage).toBe('Synced successfully');
  });

  it('stores lastSyncedAt in localStorage after a successful sync', async () => {
    mockCreateSyncTask.mockResolvedValue({ id: 'task-1' });
    mockPollSyncTask.mockResolvedValue(makeTask('SUCCESSFUL'));
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    await act(async () => {
      result.current.triggerSync();
    });

    expect(result.current.lastSyncedAt).not.toBeNull();
    expect(localStorage.getItem(LAST_SYNCED_KEY)).not.toBeNull();
  });

  it('invalidates the view data query after a successful sync', async () => {
    mockCreateSyncTask.mockResolvedValue({ id: 'task-1' });
    mockPollSyncTask.mockResolvedValue(makeTask('SUCCESSFUL'));
    const { wrapper, queryClient } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    await act(async () => {
      result.current.triggerSync();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: viewKeys.data(VIEW_ID) });
  });

  it('sets cooldown and stores it in localStorage on success with retryAfter', async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    mockCreateSyncTask.mockResolvedValue({ id: 'task-1' });
    mockPollSyncTask.mockResolvedValue(makeTask('SUCCESSFUL', { retryAfter: future }));
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    await act(async () => {
      result.current.triggerSync();
    });

    expect(result.current.isDisabled).toBe(true);
    expect(result.current.countdownLabel).not.toBeNull();
    expect(localStorage.getItem(COOLDOWN_KEY)).toBe(future);
  });

  // ---------------------------------------------------------------------------
  // Error cases
  // ---------------------------------------------------------------------------

  it('sets statusMessage to "Synced too recently" on ERROR with retryAfter', async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    mockCreateSyncTask.mockResolvedValue({ id: 'task-1' });
    mockPollSyncTask.mockResolvedValue(makeTask('ERROR', { retryAfter: future }));
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    await act(async () => {
      result.current.triggerSync();
    });

    expect(result.current.statusMessage).toBe('Synced too recently');
    expect(result.current.isDisabled).toBe(true);
  });

  it('sets statusMessage from the server message on ERROR without retryAfter', async () => {
    mockCreateSyncTask.mockResolvedValue({ id: 'task-1' });
    mockPollSyncTask.mockResolvedValue(makeTask('ERROR', { message: 'Something went wrong' }));
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    await act(async () => {
      result.current.triggerSync();
    });

    expect(result.current.statusMessage).toBe('Something went wrong');
    expect(result.current.isRunning).toBe(false);
  });

  it('falls back to "Sync failed" when ERROR has an empty message and no retryAfter', async () => {
    mockCreateSyncTask.mockResolvedValue({ id: 'task-1' });
    mockPollSyncTask.mockResolvedValue(makeTask('ERROR'));
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    await act(async () => {
      result.current.triggerSync();
    });

    expect(result.current.statusMessage).toBe('Sync failed');
  });

  it('sets statusMessage to "Sync failed — please try again" on network error', async () => {
    mockCreateSyncTask.mockRejectedValue(new Error('Network error'));
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    await act(async () => {
      result.current.triggerSync();
    });

    expect(result.current.statusMessage).toBe('Sync failed — please try again');
    expect(result.current.isRunning).toBe(false);
  });

  it('silently ignores AbortError', async () => {
    mockCreateSyncTask.mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useSyncView(VIEW_ID), { wrapper });
    await act(async () => {
      result.current.triggerSync();
    });

    expect(result.current.statusMessage).toBeNull();
  });
});
