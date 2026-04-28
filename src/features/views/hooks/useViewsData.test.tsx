import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useViewsData } from "./useViewsData.ts";
import { viewKeys } from "@/features/views/api/viewQueries.ts";
import { View } from "@/features/views/model/view.ts";
import { SimpleView } from "@/features/views/api/view-types.ts";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockServiceGet = vi.fn();
const mockUserRequest = vi.fn();
const mockUserRequestVoid = vi.fn();

vi.mock("@/shared/api/httpClient.ts", () => ({
  serviceGet: (...args: unknown[]) => mockServiceGet(...args),
  userRequest: (...args: unknown[]) => mockUserRequest(...args),
  userRequestVoid: (...args: unknown[]) => mockUserRequestVoid(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSimpleView = (id: string, name: string): SimpleView => ({
  id,
  name,
  owner: "testuser",
  published: true,
  entitiesIds: [],
  game: "WOW",
  featured: false,
  extraArguments: null,
});

const makeView = (id: string, name: string, isSynced = true): View => ({
  id,
  simpleView: makeSimpleView(id, name),
  isSynced,
});

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useViewsData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServiceGet.mockResolvedValue({ records: [] });
    mockUserRequest.mockResolvedValue({ records: [] });
    mockUserRequestVoid.mockResolvedValue(undefined);
  });

  describe("featured views", () => {
    it("fetches featured views using serviceGet on mount", async () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useViewsData(false), { wrapper });

      await waitFor(() =>
        expect(mockServiceGet).toHaveBeenCalledWith("/views?game=wow&featured=true"),
      );
    });

    it("returns the featured views from the API", async () => {
      mockServiceGet.mockResolvedValue({ records: [makeSimpleView("v1", "Featured")] });
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(false), { wrapper });

      await waitFor(() => expect(result.current.featuredViews).toHaveLength(1));
      expect(result.current.featuredViews[0].id).toBe("v1");
    });
  });

  describe("own views", () => {
    it("does not fetch own views when not authenticated", async () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useViewsData(false), { wrapper });

      await waitFor(() => expect(mockServiceGet).toHaveBeenCalled());
      expect(mockUserRequest).not.toHaveBeenCalled();
    });

    it("fetches own views using userRequest when authenticated", async () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() =>
        expect(mockUserRequest).toHaveBeenCalledWith("GET", "/views?game=wow"),
      );
    });

    it("returns the own views from the API", async () => {
      mockUserRequest.mockResolvedValue({ records: [makeSimpleView("v1", "My View")] });
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.ownViews).toHaveLength(1));
      expect(result.current.ownViews[0].id).toBe("v1");
    });
  });

  describe("createView", () => {
    it("adds the pending view to the cache immediately", async () => {
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.isLoadingOwn).toBe(false));

      const pending = makeView("", "New View", false);
      act(() => result.current.createView(pending));

      await waitFor(() =>
        expect(result.current.ownViews).toContainEqual(pending),
      );
    });
  });

  describe("deleteView", () => {
    it("removes the view from the cache optimistically", async () => {
      const { wrapper, queryClient } = makeWrapper();
      queryClient.setQueryData<View[]>(viewKeys.ownList(), [makeView("v1", "My View")]);

      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await act(async () => result.current.deleteView("v1"));

      await waitFor(() =>
        expect(result.current.ownViews.find((v) => v.id === "v1")).toBeUndefined(),
      );
    });

    it("restores the view in the cache when the API call fails", async () => {
      mockUserRequestVoid.mockRejectedValue(new Error("Server error"));
      const { wrapper, queryClient } = makeWrapper();
      queryClient.setQueryData<View[]>(viewKeys.ownList(), [makeView("v1", "My View")]);

      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await act(async () => result.current.deleteView("v1"));

      await waitFor(() =>
        expect(result.current.ownViews.find((v) => v.id === "v1")).toBeDefined(),
      );
    });
  });

  describe("unconfirmed views", () => {
    it("keeps pending unsynced views that are missing from the backend refetch", async () => {
      const { wrapper, queryClient } = makeWrapper();
      const pending = makeView("", "Pending View", false);

      queryClient.setQueryData<View[]>(viewKeys.ownList(), [pending]);

      mockUserRequest.mockResolvedValue({ records: [] });

      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await act(async () => {
        await queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
      });

      await waitFor(() =>
        expect(result.current.ownViews).toContainEqual(expect.objectContaining({ isSynced: false })),
      );
    });
  });
});
