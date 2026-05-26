import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { ToastProvider } from '@/shared/components/toaster/ToastProvider.tsx';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/app/authSlice.ts';
import { useViewDetail } from './useViewDetail.ts';
import { viewKeys } from '@/features/views/api/viewQueries.ts';
import { RaiderioProfile } from '@/features/views/api/raiderio.ts';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUserRequest = vi.fn();
const mockServiceGet = vi.fn();
const mockPollOperation = vi.fn();

vi.mock('@/shared/api/httpClient.ts', () => ({
  userRequest: (...args: unknown[]) => mockUserRequest(...args),
  serviceGet: (...args: unknown[]) => mockServiceGet(...args),
}));

vi.mock('@/features/views/api/viewQueries.ts', async () => {
  const actual = await vi.importActual<typeof import('@/features/views/api/viewQueries.ts')>(
    '@/features/views/api/viewQueries.ts',
  );
  return { ...actual, pollOperation: (...args: unknown[]) => mockPollOperation(...args) };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_ID = '12345678-1234-1234-1234-123456789012';
const INVALID_ID = 'not-a-uuid';
const OWNER = 'viewowner';

const makeProfile = (name: string, id = Date.now() + Math.random()): RaiderioProfile => ({
  id,
  name,
  realm: 'Tarren Mill',
  region: 'eu',
  score: 2000,
  class: 'Warrior',
  spec: 'Arms',
  quantile: 1.5,
  mythicPlusBestRuns: [],
  mythicPlusRecentRuns: [],
  mythicPlusRanks: {
    overall: { world: 100, region: 50, realm: 10 },
    class: { world: 100, region: 50, realm: 10 },
    specs: [],
  },
});

// A character that was just added in the edit dialog and has never been synced.
const makeNewProfile = (name: string): RaiderioProfile => ({
  ...makeProfile(name),
  score: null,
  class: '',
  spec: '',
});

const makeWrapper = (username: string | null = null) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        accessToken: username ? 'token' : null,
        refreshToken: null,
        username,
      },
    },
  });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </Provider>
  );

  return { wrapper, queryClient };
};

const seedCache = (queryClient: QueryClient, profiles: RaiderioProfile[] = []) => {
  queryClient.setQueryData(viewKeys.data(VALID_ID), { data: profiles, viewName: 'Test View' });
  queryClient.setQueryData(viewKeys.cachedData(VALID_ID), { data: [], viewName: 'Test View' });
  queryClient.setQueryData(viewKeys.static(), null);
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useViewDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRequest.mockResolvedValue({ id: 'op-123' });
    mockServiceGet.mockResolvedValue({ data: [], viewName: 'Test View' });
    mockPollOperation.mockResolvedValue({ id: 'op-123', status: 'COMPLETED' });
  });

  describe('UUID validation', () => {
    it('marks an invalid UUID as invalid', () => {
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewDetail(INVALID_ID, OWNER), { wrapper });
      expect(result.current.isViewIdValid).toBe(false);
    });

    it('marks a valid UUID as valid', () => {
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });
      expect(result.current.isViewIdValid).toBe(true);
    });
  });

  describe('initialized', () => {
    it('is true once data is available in the cache', async () => {
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });
      await waitFor(() => expect(result.current.initialized).toBe(true));
    });
  });

  describe('profiles', () => {
    it('returns empty array when there is no data', async () => {
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, []);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });
      await waitFor(() => expect(result.current.initialized).toBe(true));
      expect(result.current.profiles).toEqual([]);
    });

    it('returns the API profiles normally', async () => {
      const charA = makeProfile('Arthas');
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });
      await waitFor(() => expect(result.current.profiles).toHaveLength(1));
      expect(result.current.profiles[0].name).toBe('Arthas');
    });

    it('shows pending characters immediately when adding new ones', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeNewProfile('Sylvanas');

      let resolvePoll!: (val: { id: string; status: string }) => void;
      mockPollOperation.mockImplementation(
        () =>
          new Promise((res) => {
            resolvePoll = res;
          }),
      );

      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));

      act(() => {
        result.current.saveCharacters([charA, charB]);
      });

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(true);
        expect(result.current.profiles.map((p) => p.name)).toEqual(['Arthas', 'Sylvanas']);
      });

      await act(async () => {
        resolvePoll({ id: 'op-123', status: 'COMPLETED' });
      });
      await waitFor(() => expect(result.current.isSyncing).toBe(false));
    });

    it('keeps deleted characters visible with score null while the operation is in flight', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeProfile('Sylvanas');

      let resolvePoll!: (val: { id: string; status: string }) => void;
      mockPollOperation.mockImplementation(
        () =>
          new Promise((res) => {
            resolvePoll = res;
          }),
      );

      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA, charB]);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(2));

      act(() => {
        result.current.saveCharacters([charA]);
      });

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(true);
        expect(result.current.profiles).toHaveLength(2);
        expect(result.current.profiles.find((p) => p.name === 'Sylvanas')?.score).toBeNull();
        expect(result.current.profiles.find((p) => p.name === 'Arthas')?.score).toBe(2000);
      });

      await act(async () => {
        resolvePoll({ id: 'op-123', status: 'COMPLETED' });
      });
      await waitFor(() => expect(result.current.isSyncing).toBe(false));
    });
  });

  describe('canEdit', () => {
    it('is true when the logged-in user is the view owner', () => {
      const { wrapper, queryClient } = makeWrapper(OWNER);
      seedCache(queryClient);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });
      expect(result.current.canEdit).toBe(true);
    });

    it('is false when the logged-in user is not the owner', () => {
      const { wrapper, queryClient } = makeWrapper('otheruser');
      seedCache(queryClient);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });
      expect(result.current.canEdit).toBe(false);
    });

    it('is false when the user is not authenticated', () => {
      const { wrapper, queryClient } = makeWrapper(null);
      seedCache(queryClient);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });
      expect(result.current.canEdit).toBe(false);
    });
  });

  describe('clearSyncError', () => {
    it('clears the sync error', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeNewProfile('Sylvanas');
      mockPollOperation.mockResolvedValue({ id: 'op-123', status: 'FAILED' });
      mockServiceGet.mockResolvedValue({ data: [], viewName: 'Test View' });

      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));

      act(() => {
        result.current.saveCharacters([charA, charB]);
      });

      await waitFor(() => expect(result.current.syncError).not.toBeNull());

      act(() => result.current.clearSyncError());

      await waitFor(() => expect(result.current.syncError).toBeNull());
    });
  });

  describe('saveCharacters', () => {
    it('does nothing when the character list has not changed', async () => {
      const charA = makeProfile('Arthas');
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));
      await act(async () => result.current.saveCharacters([charA]));

      expect(mockUserRequest).not.toHaveBeenCalledWith('PUT', expect.anything(), expect.anything());
    });

    it('calls PUT and polls the operation when the character list changes', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeProfile('Sylvanas');
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));
      await act(async () => result.current.saveCharacters([charA, charB]));

      expect(mockUserRequest).toHaveBeenCalledWith('PUT', `/views/${VALID_ID}`, expect.any(Object));
      await waitFor(() => expect(mockPollOperation).toHaveBeenCalledWith('op-123'));
    });

    it('clears isSyncing when the PUT request itself fails', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeProfile('Sylvanas');
      mockUserRequest.mockRejectedValue(new Error('Network error'));

      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));

      await act(async () => result.current.saveCharacters([charA, charB]));

      expect(result.current.isSyncing).toBe(false);
    });

    it('clears isSyncing and refreshes view data when an unexpected polling error occurs', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeProfile('Sylvanas');
      mockPollOperation.mockRejectedValue(new Error('Network error'));

      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));

      act(() => {
        result.current.saveCharacters([charA, charB]);
      });

      await waitFor(() => expect(result.current.isSyncing).toBe(false));
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: viewKeys.data(VALID_ID) });
    });

    it('clears isSyncing and refreshes view data when the fresh fetch fails after an operation failure', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeProfile('Sylvanas');
      mockPollOperation.mockResolvedValue({ id: 'op-123', status: 'FAILED' });
      mockServiceGet.mockRejectedValue(new Error('Network error'));

      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));

      act(() => {
        result.current.saveCharacters([charA, charB]);
      });

      await waitFor(() => expect(result.current.isSyncing).toBe(false));
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: viewKeys.data(VALID_ID) });
    });

    it('sets characters that failed to be deleted in syncError when the delete operation fails', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeProfile('Sylvanas');
      mockPollOperation.mockResolvedValue({ id: 'op-123', status: 'FAILED' });
      mockServiceGet.mockResolvedValue({ data: [charA, charB], viewName: 'Test View' });

      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA, charB]);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(2));

      act(() => {
        result.current.saveCharacters([charA]);
      });

      await waitFor(() => {
        expect(result.current.syncError).toEqual([charB]);
        expect(result.current.isSyncing).toBe(false);
      });
    });

    it('sets only the failed characters in syncError when the operation partially fails', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeNewProfile('Sylvanas');
      mockPollOperation.mockResolvedValue({ id: 'op-123', status: 'FAILED' });
      mockServiceGet.mockResolvedValue({ data: [charA], viewName: 'Test View' });

      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));

      act(() => {
        result.current.saveCharacters([charA, charB]);
      });

      await waitFor(() => {
        expect(result.current.syncError).toEqual([charB]);
        expect(result.current.isSyncing).toBe(false);
      });
    });

    it('sets all pending characters in syncError when the operation fully fails', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeNewProfile('Sylvanas');
      mockPollOperation.mockResolvedValue({ id: 'op-123', status: 'FAILED' });
      mockServiceGet.mockResolvedValue({ data: [], viewName: 'Test View' });

      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));

      act(() => {
        result.current.saveCharacters([charA, charB]);
      });

      await waitFor(() => {
        expect(result.current.syncError).toEqual([charA, charB]);
        expect(result.current.isSyncing).toBe(false);
      });
    });
  });
});
