import { useState, useEffect } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ViewsPage } from "./views-page.tsx";
import authReducer from "@/app/authSlice.ts";
import {
  MockViewsList,
  MockCreateView,
  makeSimpleView,
} from "@/app/App.mocks.tsx";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const fetchMocks = vi.hoisted(() => ({
  serviceGet: vi.fn(),
  userRequest: vi.fn(),
  userRequestVoid: vi.fn(),
}));

const navState = vi.hoisted(() => {
  let path = "/";
  const listeners: (() => void)[] = [];

  return {
    get path() {
      return path;
    },
    navigate(to: string) {
      path = to;
      listeners.slice().forEach((l) => l());
    },
    reset() {
      path = "/";
    },
    subscribe(l: () => void) {
      listeners.push(l);
      return () => {
        const i = listeners.indexOf(l);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("react-router-dom", () => ({
  useNavigate: () => (to: string) => navState.navigate(to),
  useLocation: () => ({ pathname: navState.path, state: null }),
}));

vi.mock("@/shared/api/httpClient.ts", () => fetchMocks);

vi.mock("@/features/auth/authApi.ts", () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/views/components/views-page/views-list.tsx", () => ({
  ViewsList: (props: Parameters<typeof MockViewsList>[0]) => (
    <MockViewsList {...props} />
  ),
}));

vi.mock(
  "@/features/views/components/views-page/actions/create-view.tsx",
  () => ({
    CreateView: (props: Parameters<typeof MockCreateView>[0]) => (
      <MockCreateView {...props} />
    ),
  }),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const createStore = (authenticated = true) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: authenticated
        ? {
            accessToken: "test-token",
            refreshToken: "test-refresh",
            username: null,
          }
        : { accessToken: null, refreshToken: null, username: null },
    },
  });

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: 0 },
    },
  });

const renderViewsPage = (authenticated = true) => {
  const store = createStore(authenticated);
  const testQueryClient = createTestQueryClient();

  function Wrapper() {
    const [, tick] = useState(0);
    useEffect(() => navState.subscribe(() => tick((n) => n + 1)), []);
    return <ViewsPage />;
  }

  const result = render(
    <Provider store={store}>
      <QueryClientProvider client={testQueryClient}>
        <Wrapper />
      </QueryClientProvider>
    </Provider>,
  );

  return { ...result, queryClient: testQueryClient };
};

// Authenticated users land on "own" tab — own views use userRequest.
const renderWithViews = async (views = [makeSimpleView("v1", "My View")]) => {
  fetchMocks.userRequest.mockResolvedValue({ records: views });
  const result = renderViewsPage();
  if (views.length > 0) {
    await waitFor(() => screen.getByTestId(`view-item-${views[0].id}`));
  } else {
    await waitFor(() => screen.getByTestId("views-list"));
  }
  return result;
};

describe("ViewsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navState.reset();
    fetchMocks.serviceGet.mockResolvedValue({ records: [] });
    fetchMocks.userRequest.mockResolvedValue({ records: [] });
    fetchMocks.userRequestVoid.mockResolvedValue(undefined);
  });

  afterEach(() => vi.unstubAllEnvs());

  describe("initial render", () => {
    it("renders the views list", async () => {
      renderViewsPage();
      await waitFor(() =>
        expect(screen.getByTestId("views-list")).toBeInTheDocument(),
      );
    });

    it("shows the app title", async () => {
      renderViewsPage();
      await waitFor(() =>
        expect(screen.getByText("Mythic+ ladder tracker")).toBeInTheDocument(),
      );
    });

    it("shows the current season label", async () => {
      renderViewsPage();
      await waitFor(() =>
        expect(screen.getByText("Midnight Season 1")).toBeInTheDocument(),
      );
    });
  });

  describe("fetching views on mount", () => {
    it("calls serviceGet for featured views", async () => {
      renderViewsPage();
      await waitFor(() =>
        expect(fetchMocks.serviceGet).toHaveBeenCalledWith(
          "/views?game=wow&featured=true",
        ),
      );
    });

    it("calls userRequest for own views when authenticated", async () => {
      renderViewsPage();
      await waitFor(() =>
        expect(fetchMocks.userRequest).toHaveBeenCalledWith(
          "GET",
          "/views?game=wow",
        ),
      );
    });

    it("does not fetch own views when unauthenticated", async () => {
      renderViewsPage(false);
      await waitFor(() => expect(fetchMocks.serviceGet).toHaveBeenCalled());
      expect(fetchMocks.userRequest).not.toHaveBeenCalled();
    });

    it("displays fetched own views", async () => {
      await renderWithViews([makeSimpleView("v1", "My View")]);
      expect(screen.getByTestId("view-item-v1")).toBeInTheDocument();
    });
  });

  describe("Create View dialog", () => {
    it("opens the create dialog when triggered from ViewsList", async () => {
      renderViewsPage();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));

      expect(screen.getByTestId("create-view-dialog")).toBeInTheDocument();
    });

    it("closes the create dialog when onOpenChange(false) is called", async () => {
      renderViewsPage();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));
      await userEvent.click(screen.getByTestId("close-dialog"));

      expect(
        screen.queryByTestId("create-view-dialog"),
      ).not.toBeInTheDocument();
    });

    it("redirects unauthenticated users to login when clicking create", async () => {
      renderViewsPage(false);
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));

      expect(navState.path).toBe("/login");
    });
  });

  describe("handleCreateView", () => {
    it("adds the pending view to the list", async () => {
      renderViewsPage();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));
      await userEvent.click(screen.getByTestId("submit-create"));

      expect(screen.getByTestId("view-item-pending-id")).toBeInTheDocument();
    });
  });

  describe("handleViewClick", () => {
    it("navigates to the view detail screen", async () => {
      await renderWithViews();
      await userEvent.click(screen.getByTestId("open-v1"));

      expect(navState.path).toBe("/v1");
    });
  });

  describe("handleDeleteView", () => {
    it("removes the view from the list optimistically", async () => {
      await renderWithViews();
      fetchMocks.userRequest.mockResolvedValue({ records: [] });

      await userEvent.click(screen.getByTestId("delete-v1"));

      await waitFor(() =>
        expect(screen.queryByTestId("view-item-v1")).not.toBeInTheDocument(),
      );
    });

    it("calls the DELETE API with the correct viewId", async () => {
      await renderWithViews();
      await userEvent.click(screen.getByTestId("delete-v1"));

      await waitFor(() =>
        expect(fetchMocks.userRequestVoid).toHaveBeenCalledWith(
          "DELETE",
          "/views/v1",
        ),
      );
    });

    it("re-fetches own views when the DELETE API call fails", async () => {
      fetchMocks.userRequestVoid.mockRejectedValue(new Error("Network error"));
      await renderWithViews();
      const callsBefore = fetchMocks.userRequest.mock.calls.length;

      await userEvent.click(screen.getByTestId("delete-v1"));

      await waitFor(() =>
        expect(fetchMocks.userRequest.mock.calls.length).toBeGreaterThan(
          callsBefore,
        ),
      );
    });
  });

  describe("reconcileViews", () => {
    it("keeps pending views not yet present in the backend", async () => {
      const { queryClient } = renderViewsPage();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));
      await userEvent.click(screen.getByTestId("submit-create"));

      await act(async () => {
        queryClient.setQueryData(["views", "own"], []);
      });

      expect(screen.getByTestId("view-item-pending-id")).toBeInTheDocument();
    });

    it("replaces a pending view with the synced one when it appears in the backend", async () => {
      const { queryClient } = renderViewsPage();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));
      await userEvent.click(screen.getByTestId("submit-create"));

      fetchMocks.userRequest.mockResolvedValue({
        records: [makeSimpleView("real-id", "Pending View")],
      });
      await act(async () => {
        await queryClient.invalidateQueries({ queryKey: ["views", "own"] });
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId("view-item-pending-id"),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId("view-item-real-id")).toBeInTheDocument();
      });
    });
  });
});
