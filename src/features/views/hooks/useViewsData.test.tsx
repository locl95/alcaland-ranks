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
const mockPollOperation = vi.fn();

vi.mock("@/shared/api/httpClient.ts", () => ({
  serviceGet: (...args: unknown[]) => mockServiceGet(...args),
  userRequest: (...args: unknown[]) => mockUserRequest(...args),
}));

vi.mock("@/features/views/api/viewQueries.ts", async () => {
  const actual = await vi.importActual<typeof import("@/features/views/api/viewQueries.ts")>(
    "@/features/views/api/viewQueries.ts",
  );
  return { ...actual, pollOperation: (...args: unknown[]) => mockPollOperation(...args) };
});

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

const makeView = (id: string, name: string, status: View["status"] = "synced"): View => ({
  operationId: status === "pending" ? id : null,
  simpleView: makeSimpleView(id, name),
  status,
});

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    },
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
    mockPollOperation.mockResolvedValue({ id: "op-123", status: "COMPLETED" });
  });

  describe("featured views", () => {
    it("fetches featured views using serviceGet on mount", async () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useViewsData(false), { wrapper });
      await waitFor(() => expect(mockServiceGet).toHaveBeenCalledWith("/views?game=wow&featured=true"));
    });

    it("returns the featured views from the API", async () => {
      mockServiceGet.mockResolvedValue({ records: [makeSimpleView("v1", "Featured")] });
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(false), { wrapper });
      await waitFor(() => expect(result.current.featuredViews).toHaveLength(1));
      expect(result.current.featuredViews[0].simpleView.id).toBe("v1");
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
      await waitFor(() => expect(mockUserRequest).toHaveBeenCalledWith("GET", "/views?game=wow"));
    });

    it("returns the own views from the API", async () => {
      mockUserRequest.mockResolvedValue({ records: [makeSimpleView("v1", "My View")] });
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });
      await waitFor(() => expect(result.current.ownViews).toHaveLength(1));
      expect(result.current.ownViews[0].simpleView.id).toBe("v1");
    });
  });

  describe("createView", () => {
    it("adds the pending view to the list immediately", async () => {
      mockPollOperation.mockReturnValue(new Promise(() => {}));
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.isLoadingOwn).toBe(false));

      const pending = makeView("op-123", "New View", "pending");
      act(() => result.current.createView(pending));

      await waitFor(() => expect(result.current.ownViews).toContainEqual(pending));
    });

    it("promotes the pending view to synced when the operation completes", async () => {
      mockPollOperation.mockResolvedValue({ id: "op-123", status: "COMPLETED", resourceId: "real-view-id" });
      mockUserRequest
        .mockResolvedValueOnce({ records: [] })
        .mockResolvedValue({ records: [makeSimpleView("real-view-id", "New View")] });

      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.isLoadingOwn).toBe(false));

      const pending = makeView("op-123", "New View", "pending");
      act(() => result.current.createView(pending));

      await waitFor(() => {
        const view = result.current.ownViews.find((v) => v.simpleView.name === "New View");
        expect(view?.simpleView.id).toBe("real-view-id");
        expect(view?.status).toBe("synced");
      });
    });

    it("removes the pending view and sets createError when the operation fails", async () => {
      mockPollOperation.mockResolvedValue({ id: "op-123", status: "FAILED" });
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.isLoadingOwn).toBe(false));

      const pending = makeView("op-123", "New View", "pending");
      act(() => result.current.createView(pending));

      await waitFor(() => {
        expect(result.current.ownViews.find((v) => v.operationId === "op-123")).toBeUndefined();
        expect(result.current.createError).not.toBeNull();
      });
    });

    it("clears createError when clearCreateError is called", async () => {
      mockPollOperation.mockResolvedValue({ id: "op-123", status: "FAILED" });
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.isLoadingOwn).toBe(false));

      act(() => result.current.createView(makeView("op-123", "New View", "pending")));
      await waitFor(() => expect(result.current.createError).not.toBeNull());

      act(() => result.current.clearCreateError());
      await waitFor(() => expect(result.current.createError).toBeNull());
    });

    it("removes the pending view and invalidates when polling throws a network error", async () => {
      mockPollOperation.mockRejectedValue(new Error("Network error"));
      const { wrapper, queryClient } = makeWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.isLoadingOwn).toBe(false));

      act(() => result.current.createView(makeView("op-123", "New View", "pending")));

      await waitFor(() => {
        expect(result.current.ownViews.find((v) => v.operationId === "op-123")).toBeUndefined();
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: viewKeys.ownList() });
      });
      expect(result.current.createError).toBeNull();
    });

    it("keeps pending views in the list when a server refetch does not yet include them", async () => {
      mockPollOperation.mockReturnValue(new Promise(() => {}));
      mockUserRequest.mockResolvedValue({ records: [] });

      const { wrapper, queryClient } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.isLoadingOwn).toBe(false));

      const pending = makeView("op-123", "Pending View", "pending");
      act(() => result.current.createView(pending));

      await waitFor(() => expect(result.current.ownViews).toContainEqual(expect.objectContaining({ status: "pending" })));

      await act(async () => {
        await queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
      });

      await waitFor(() =>
        expect(result.current.ownViews).toContainEqual(expect.objectContaining({ status: "pending" })),
      );
    });
  });

  describe("deleteView", () => {
    it("removes the view from ownViews immediately on delete", async () => {
      mockUserRequest.mockImplementation((method: string) => {
        if (method === "DELETE") return new Promise(() => {});
        return Promise.resolve({ records: [makeSimpleView("v1", "My View")] });
      });
      const { wrapper, queryClient } = makeWrapper();
      queryClient.setQueryData<View[]>(viewKeys.ownList(), [makeView("v1", "My View")]);

      const { result } = renderHook(() => useViewsData(true), { wrapper });
      await waitFor(() => expect(result.current.ownViews).toHaveLength(1));

      act(() => { result.current.deleteView("v1"); });

      expect(result.current.ownViews).toHaveLength(0);
    });

    it("sets deletingViewId while the operation is in flight", async () => {
      let resolveDelete!: (v: { id: string }) => void;
      mockUserRequest.mockImplementation((method: string) => {
        if (method === "DELETE") return new Promise((res) => { resolveDelete = res; });
        return Promise.resolve({ records: [makeSimpleView("v1", "My View")] });
      });
      const { wrapper, queryClient } = makeWrapper();
      queryClient.setQueryData<View[]>(viewKeys.ownList(), [makeView("v1", "My View")]);

      const { result } = renderHook(() => useViewsData(true), { wrapper });

      act(() => { result.current.deleteView("v1"); });
      await waitFor(() => expect(result.current.deletingViewId).toBe("v1"));

      await act(async () => resolveDelete({ id: "op-123" }));
      await waitFor(() => expect(result.current.deletingViewId).toBeNull());
    });

    it("invalidates the own views list after a successful delete", async () => {
      const { wrapper, queryClient } = makeWrapper();
      queryClient.setQueryData<View[]>(viewKeys.ownList(), [makeView("v1", "My View")]);
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await act(async () => result.current.deleteView("v1"));

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: viewKeys.ownList() });
    });

    it("still invalidates the own views list when the DELETE request fails", async () => {
      mockUserRequest.mockImplementation((method: string) => {
        if (method === "DELETE") return Promise.reject(new Error("Server error"));
        return Promise.resolve({ records: [makeSimpleView("v1", "My View")] });
      });
      const { wrapper, queryClient } = makeWrapper();
      queryClient.setQueryData<View[]>(viewKeys.ownList(), [makeView("v1", "My View")]);
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await act(async () => result.current.deleteView("v1"));

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: viewKeys.ownList() });
    });

    it("still invalidates the own views list when the delete operation fails", async () => {
      mockPollOperation.mockResolvedValue({ id: "op-123", status: "FAILED" });
      const { wrapper, queryClient } = makeWrapper();
      queryClient.setQueryData<View[]>(viewKeys.ownList(), [makeView("v1", "My View")]);
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await act(async () => result.current.deleteView("v1"));

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: viewKeys.ownList() });
    });
  });
});
