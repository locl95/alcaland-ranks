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
import { wowStaticKey } from '@/games/wow/api/wow-static.ts';
import { WowProfile } from '@/games/wow/api/wow-types.ts';
import { ViewResponse } from '@/features/views/api/view-types.ts';
import { ApiError } from '@/shared/api/ApiError.ts';

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

const makeProfile = (name: string, id = Date.now() + Math.random()): WowProfile => ({
  id,
  name,
  realm: 'Tarren Mill',
  region: 'eu',
  score: 2000,
  class: 'Warrior',
  spec: 'Arms',
  quantile: 1.5,
  race: 'Human',
  faction: 'alliance',
  equippedItemLevel: 330,
  mythicPlusBestRuns: [],
  mythicPlusRecentRuns: [],
  mythicPlusRanks: {
    overall: { world: 100, region: 50, realm: 10 },
    class: { world: 100, region: 50, realm: 10 },
    specs: [],
  },
});

// A character that was just added in the edit dialog and has never been synced.
const makeNewProfile = (name: string): WowProfile => ({
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

const seedCache = (
  queryClient: QueryClient,
  profiles: WowProfile[] = [],
  view: ViewResponse | null = { owner: OWNER },
) => {
  if (view) queryClient.setQueryData(viewKeys.detail(VALID_ID), view);
  queryClient.setQueryData(viewKeys.data(VALID_ID), { data: profiles, viewName: 'Test View' });
  queryClient.setQueryData(viewKeys.cachedData(VALID_ID), { data: [], viewName: 'Test View' });
  queryClient.setQueryData(wowStaticKey(), null);
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
      const { result } = renderHook(() => useViewDetail(INVALID_ID), { wrapper });
      expect(result.current.isViewIdValid).toBe(false);
    });
  });

  describe('initialized', () => {
    it('is true once data is available in the cache', async () => {
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient);
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });
      await waitFor(() => expect(result.current.initialized).toBe(true));
    });
  });

  describe('profiles', () => {
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
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

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
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

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
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });
      expect(result.current.canEdit).toBe(true);
    });

    it('is false when the logged-in user is not the owner', () => {
      const { wrapper, queryClient } = makeWrapper('otheruser');
      seedCache(queryClient);
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });
      expect(result.current.canEdit).toBe(false);
    });

    it('is false when the user is not authenticated', () => {
      const { wrapper, queryClient } = makeWrapper(null);
      seedCache(queryClient);
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });
      expect(result.current.canEdit).toBe(false);
    });

    it('is false for a guild ladder, even for its owner', () => {
      const { wrapper, queryClient } = makeWrapper(OWNER);
      seedCache(queryClient, [], { owner: OWNER, extraArguments: { type: 'wow', isGuild: true } });
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });
      expect(result.current.canEdit).toBe(false);
    });

    it('does not fetch the view when the landing already cached it', () => {
      const { wrapper, queryClient } = makeWrapper(OWNER);
      seedCache(queryClient);
      renderHook(() => useViewDetail(VALID_ID), { wrapper });
      expect(mockUserRequest).not.toHaveBeenCalledWith('GET', `/views/${VALID_ID}`);
    });

    describe('when the view is not cached', () => {
      it('fetches the view and is true for its owner', async () => {
        mockUserRequest.mockResolvedValue({ owner: OWNER });
        const { wrapper, queryClient } = makeWrapper(OWNER);
        seedCache(queryClient, [], null);
        const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

        await waitFor(() => expect(result.current.canEdit).toBe(true));
        expect(mockUserRequest).toHaveBeenCalledWith('GET', `/views/${VALID_ID}`);
      });

      it('is false when the fetched view is a guild ladder', async () => {
        mockUserRequest.mockResolvedValue({
          owner: OWNER,
          extraArguments: { type: 'wow', isGuild: true },
        });
        const { wrapper, queryClient } = makeWrapper(OWNER);
        seedCache(queryClient, [], null);
        const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

        await waitFor(() =>
          expect(queryClient.getQueryData(viewKeys.detail(VALID_ID))).toBeDefined(),
        );
        expect(result.current.canEdit).toBe(false);
      });

      it('is false when the backend refuses the view (not the owner)', async () => {
        mockUserRequest.mockRejectedValue(new Error('403'));
        const { wrapper, queryClient } = makeWrapper('otheruser');
        seedCache(queryClient, [], null);
        const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

        await waitFor(() =>
          expect(queryClient.getQueryState(viewKeys.detail(VALID_ID))?.status).toBe('error'),
        );
        expect(result.current.canEdit).toBe(false);
      });

      it('does not fetch the view when the user is not authenticated', () => {
        const { wrapper, queryClient } = makeWrapper(null);
        seedCache(queryClient, [], null);
        renderHook(() => useViewDetail(VALID_ID), { wrapper });
        expect(mockUserRequest).not.toHaveBeenCalled();
      });
    });
  });

  describe('saveCharacters', () => {
    it('does nothing when the character list has not changed', async () => {
      const charA = makeProfile('Arthas');
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));
      await act(async () => result.current.saveCharacters([charA]));

      expect(mockUserRequest).not.toHaveBeenCalledWith('PUT', expect.anything(), expect.anything());
    });

    it('calls PUT and polls the operation when the character list changes', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeProfile('Sylvanas');
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));
      await act(async () => result.current.saveCharacters([charA, charB]));

      expect(mockUserRequest).toHaveBeenCalledWith('PUT', `/views/${VALID_ID}`, expect.any(Object));
      await waitFor(() => expect(mockPollOperation).toHaveBeenCalledWith('op-123'));
    });

    it('sends realm slugs, not the display names characters carry', async () => {
      // Existing characters come back from the API with a display name; the realm
      // picker produces a slug. Both must leave as slugs.
      const existing = { ...makeProfile('Arthas'), realm: 'Tarren Mill' };
      const added = { ...makeProfile('Sylvanas'), realm: 'silvermoon' };
      const irregular = { ...makeProfile('Speedk'), realm: "Zul'jin" };

      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [existing]);
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));
      await act(async () => result.current.saveCharacters([existing, added, irregular]));

      const [, , request] = mockUserRequest.mock.calls.find(([method]) => method === 'PUT')!;
      expect(request.entities.map((e: { realm: string }) => e.realm)).toEqual([
        'tarren-mill',
        'silvermoon',
        'zuljin',
      ]);
    });

    it('returns the generic error and does not sync when the PUT request itself fails', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeProfile('Sylvanas');
      mockUserRequest.mockRejectedValue(new Error('Network error'));

      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));

      let error: string | null = null;
      await act(async () => {
        error = await result.current.saveCharacters([charA, charB]);
      });

      expect(error).toBe('Failed to save changes — please try again');
      expect(result.current.isSyncing).toBe(false);
      expect(mockPollOperation).not.toHaveBeenCalled();
    });

    it('returns the limit message when the ladder exceeds the character limit', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeProfile('Sylvanas');
      mockUserRequest.mockRejectedValue(new ApiError(400, 'Bad Request', 'TOO_MANY_ENTITIES'));

      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));

      let error: string | null = null;
      await act(async () => {
        error = await result.current.saveCharacters([charA, charB]);
      });

      expect(error).toBe('This ladder has more characters than allowed.');
      expect(result.current.isSyncing).toBe(false);
    });

    it('clears isSyncing and refreshes view data when an unexpected polling error occurs', async () => {
      const charA = makeProfile('Arthas');
      const charB = makeProfile('Sylvanas');
      mockPollOperation.mockRejectedValue(new Error('Network error'));

      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

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
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

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
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

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
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

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
      const { result } = renderHook(() => useViewDetail(VALID_ID), { wrapper });

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
