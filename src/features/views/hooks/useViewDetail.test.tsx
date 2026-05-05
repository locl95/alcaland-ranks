import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/app/authSlice.ts";
import { useViewDetail } from "./useViewDetail.ts";
import { viewKeys } from "@/features/views/api/viewQueries.ts";
import { RaiderioProfile } from "@/features/views/api/raiderio.ts";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUserRequestVoid = vi.fn();

vi.mock("@/shared/api/httpClient.ts", () => ({
  userRequestVoid: (...args: unknown[]) => mockUserRequestVoid(...args),
  serviceGet: vi.fn().mockResolvedValue({}),
  userRequest: vi.fn().mockResolvedValue({}),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_ID = "12345678-1234-1234-1234-123456789012";
const INVALID_ID = "not-a-uuid";
const OWNER = "viewowner";

const makeProfile = (
  name: string,
  id = Date.now() + Math.random(),
): RaiderioProfile => ({
  id,
  name,
  realm: "Tarren Mill",
  region: "eu",
  score: 2000,
  class: "Warrior",
  spec: "Arms",
  quantile: 1.5,
  mythicPlusBestRuns: [],
  mythicPlusRecentRuns: [],
  mythicPlusRanks: {
    overall: { world: 100, region: 50, realm: 10 },
    class: { world: 100, region: 50, realm: 10 },
    specs: [],
  },
});

const makeWrapper = (username: string | null = null) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        accessToken: username ? "token" : null,
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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );

  return { wrapper, queryClient, store };
};

const seedCache = (
  queryClient: QueryClient,
  profiles: RaiderioProfile[] = [],
) => {
  queryClient.setQueryData(viewKeys.data(VALID_ID), {
    data: profiles,
    viewName: "Test View",
  });
  queryClient.setQueryData(viewKeys.cachedData(VALID_ID), {
    data: [],
    viewName: "Test View",
  });
  queryClient.setQueryData(viewKeys.static(), null);
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useViewDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRequestVoid.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("UUID validation", () => {
    it("marks an invalid UUID as invalid", () => {
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewDetail(INVALID_ID, OWNER, 0), {
        wrapper,
      });
      expect(result.current.isViewIdValid).toBe(false);
    });

    it("marks a valid UUID as valid", () => {
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER, 0), {
        wrapper,
      });
      expect(result.current.isViewIdValid).toBe(true);
    });
  });

  describe("initialized", () => {
    it("is true once data is available in the cache", async () => {
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient);

      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER, 0), {
        wrapper,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));
    });
  });

  describe("profiles", () => {
    it("returns empty array when there is no data", async () => {
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, []);

      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER, 0), {
        wrapper,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));
      expect(result.current.profiles).toEqual([]);
    });

    it("returns the API profiles when there is no editMeta", async () => {
      const charA = makeProfile("Arthas");
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);

      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER, 0), {
        wrapper,
      });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));
      expect(result.current.profiles[0].name).toBe("Arthas");
    });

    it("returns pending characters when editMeta is set and backend has not caught up", async () => {
      const charA = makeProfile("Arthas");
      const charB = makeProfile("Sylvanas");
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, []);
      queryClient.setQueryData(viewKeys.editMeta(VALID_ID), {
        pendingCharacters: [charA, charB],
      });

      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER, 0), {
        wrapper,
      });

      await waitFor(() => expect(result.current.profiles).toHaveLength(2));
      expect(result.current.profiles.map((p) => p.name)).toEqual([
        "Arthas",
        "Sylvanas",
      ]);
    });

    it("returns API data when backend catches up with pending characters", async () => {
      const charA = makeProfile("Arthas");
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);
      queryClient.setQueryData(viewKeys.editMeta(VALID_ID), {
        pendingCharacters: [charA],
      });

      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER, 0), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.editMeta).toBeNull();
        expect(result.current.profiles).toHaveLength(1);
        expect(result.current.profiles[0].name).toBe("Arthas");
      });
    });
  });

  describe("canEdit", () => {
    it("is true when the logged-in user is the view owner", async () => {
      const { wrapper, queryClient } = makeWrapper(OWNER);
      seedCache(queryClient);

      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER, 0), {
        wrapper,
      });

      expect(result.current.canEdit).toBe(true);
    });

    it("is false when the logged-in user is not the owner", async () => {
      const { wrapper, queryClient } = makeWrapper("otheruser");
      seedCache(queryClient);

      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER, 0), {
        wrapper,
      });

      expect(result.current.canEdit).toBe(false);
    });

    it("is false when the user is not authenticated", async () => {
      const { wrapper, queryClient } = makeWrapper(null);
      seedCache(queryClient);

      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER, 0), {
        wrapper,
      });

      expect(result.current.canEdit).toBe(false);
    });
  });

  describe("clearSyncError", () => {
    it("removes the syncError from the cache", async () => {
      const charA = makeProfile("Arthas");
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient);
      queryClient.setQueryData(viewKeys.syncError(VALID_ID), [charA]);

      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER, 0), {
        wrapper,
      });

      await waitFor(() => expect(result.current.syncError).toEqual([charA]));

      act(() => result.current.clearSyncError());

      await waitFor(() => expect(result.current.syncError).toBeNull());
    });
  });

  describe("saveCharacters", () => {
    it("does nothing when the character list has not changed", async () => {
      const charA = makeProfile("Arthas");
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);

      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER, 0), {
        wrapper,
      });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));

      await act(async () => result.current.saveCharacters([charA]));

      expect(mockUserRequestVoid).not.toHaveBeenCalled();
    });

    it("calls PUT and sets editMeta when the character list changes", async () => {
      const charA = makeProfile("Arthas");
      const charB = makeProfile("Sylvanas");
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, [charA]);

      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER, 0), {
        wrapper,
      });

      await waitFor(() => expect(result.current.profiles).toHaveLength(1));

      await act(async () => result.current.saveCharacters([charA, charB]));

      expect(mockUserRequestVoid).toHaveBeenCalledWith(
        "PUT",
        `/views/${VALID_ID}`,
        expect.any(Object),
      );
      expect(result.current.editMeta).toEqual({
        pendingCharacters: [charA, charB],
      });
    });
  });

  describe("sync timeout", () => {
    it("sets syncError for missing characters after MAX_EDIT_POLLS data updates", async () => {
      let time = 1_000_000;
      vi.spyOn(Date, "now").mockImplementation(() => ++time);

      const charA = makeProfile("Arthas");
      const { wrapper, queryClient } = makeWrapper();
      seedCache(queryClient, []);
      queryClient.setQueryData(viewKeys.editMeta(VALID_ID), {
        pendingCharacters: [charA],
      });

      const { result } = renderHook(() => useViewDetail(VALID_ID, OWNER, 0), {
        wrapper,
      });

      await waitFor(() => expect(result.current.initialized).toBe(true));

      // Trigger 5 data updates without the backend catching up
      for (let i = 0; i < 5; i++) {
        act(() => {
          queryClient.setQueryData(viewKeys.data(VALID_ID), {
            data: [],
            viewName: "Test View",
          });
        });
        await waitFor(() => {});
      }

      await waitFor(() => {
        expect(result.current.syncError).toEqual([charA]);
        expect(result.current.editMeta).toBeNull();
      });
    });
  });
});
