import { useState, useEffect } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import authReducer from "@/app/authSlice.ts";
import type { View } from "@/features/views/model/view.ts";
import {
  MockViewsList,
  MockCreateView,
  MockViewDetail,
  makeSimpleView,
} from "@/app/App.mocks.tsx";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const fetchMocks = vi.hoisted(() => ({
  serviceGet: vi.fn(),
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
    getParams(): Record<string, string> {
      const match = path.match(/^\/(.+)$/);
      return match ? { viewId: match[1] } : {};
    },
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("react-router-dom", () => ({
  Routes: ({ children }: { children: unknown }) => <>{children}</>,
  Route: ({ path: routePath, element }: { path: string; element: unknown }) => {
    const matches =
      routePath === "/" ? navState.path === "/" : navState.path !== "/";
    return matches ? <>{element}</> : null;
  },
  Navigate: () => null,
  useNavigate: () => (to: string) => navState.navigate(to),
  useParams: () => navState.getParams(),
  useLocation: () => ({ pathname: navState.path, state: null }),
}));

vi.mock("@/shared/api/httpClient.ts", () => fetchMocks);

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

vi.mock("@/features/views/components/view-detail/view-detail.tsx", () => ({
  ViewDetail: (props: { onBack: () => void }) => <MockViewDetail {...props} />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const createStore = () =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { accessToken: "test-token", refreshToken: "test-refresh" },
    },
  });

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: 0 },
    },
  });

const renderApp = () => {
  const store = createStore();
  const testQueryClient = createTestQueryClient();

  function TestRouter() {
    const [, tick] = useState(0);
    useEffect(() => navState.subscribe(() => tick((n) => n + 1)), []);
    return <App />;
  }

  const result = render(
    <Provider store={store}>
      <QueryClientProvider client={testQueryClient}>
        <TestRouter />
      </QueryClientProvider>
    </Provider>,
  );

  return { ...result, queryClient: testQueryClient };
};

const renderWithViews = async (views = [makeSimpleView("v1", "My View")]) => {
  fetchMocks.serviceGet.mockResolvedValue({ records: views });
  const result = renderApp();
  // Wait for the async query to resolve and views to appear
  if (views.length > 0) {
    await waitFor(() => screen.getByTestId(`view-item-${views[0].id}`));
  } else {
    await waitFor(() => screen.getByTestId("views-list"));
  }
  return result;
};

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navState.reset();
    fetchMocks.serviceGet.mockResolvedValue({ records: [] });
    fetchMocks.userRequestVoid.mockResolvedValue(undefined);
  });

  afterEach(() => vi.unstubAllEnvs());

  describe("initial render", () => {
    it("renders the views list screen", async () => {
      renderApp();
      await waitFor(() =>
        expect(screen.getByTestId("views-list")).toBeInTheDocument(),
      );
    });

    it("shows the app title", async () => {
      renderApp();
      await waitFor(() =>
        expect(screen.getByText("Mythic+ ladder tracker")).toBeInTheDocument(),
      );
    });

    it("shows the current season label", async () => {
      renderApp();
      await waitFor(() =>
        expect(screen.getByText("Midnight Season 1")).toBeInTheDocument(),
      );
    });
  });

  describe("fetching views on mount", () => {
    it("calls serviceGet with the correct endpoint", async () => {
      renderApp();
      await waitFor(() =>
        expect(fetchMocks.serviceGet).toHaveBeenCalledWith("/views?game=wow"),
      );
    });

    it("displays fetched views", async () => {
      await renderWithViews([makeSimpleView("v1", "My View")]);
      expect(screen.getByTestId("view-item-v1")).toBeInTheDocument();
    });
  });

  describe("Create View dialog", () => {
    it("opens the create dialog when triggered from ViewsList", async () => {
      renderApp();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));

      expect(screen.getByTestId("create-view-dialog")).toBeInTheDocument();
    });

    it("closes the create dialog when onOpenChange(false) is called", async () => {
      renderApp();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));
      await userEvent.click(screen.getByTestId("close-dialog"));

      expect(
        screen.queryByTestId("create-view-dialog"),
      ).not.toBeInTheDocument();
    });
  });

  describe("handleCreateView", () => {
    it("adds the pending view to the list", async () => {
      renderApp();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));
      await userEvent.click(screen.getByTestId("submit-create"));

      expect(screen.getByTestId("view-item-pending-id")).toBeInTheDocument();
    });
  });

  describe("handleViewClick", () => {
    it("navigates to the view-detail screen", async () => {
      await renderWithViews();
      await userEvent.click(screen.getByTestId("open-v1"));

      await waitFor(() => {
        expect(screen.getByTestId("view-detail")).toBeInTheDocument();
        expect(screen.queryByTestId("views-list")).not.toBeInTheDocument();
      });
    });
  });

  describe("handleBackToViews", () => {
    const goToViewDetail = async () => {
      await renderWithViews();
      await userEvent.click(screen.getByTestId("open-v1"));
      await waitFor(() => screen.getByTestId("view-detail"));
    };

    it("navigates back to the views list", async () => {
      await goToViewDetail();
      await userEvent.click(screen.getByTestId("back-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("views-list")).toBeInTheDocument();
        expect(screen.queryByTestId("view-detail")).not.toBeInTheDocument();
      });
    });
  });

  describe("handleDeleteView", () => {
    it("removes the view from the list optimistically", async () => {
      await renderWithViews();
      // Backend confirms deletion — refetch should not restore the view
      fetchMocks.serviceGet.mockResolvedValue({ records: [] });
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

    it("re-fetches views when the DELETE API call fails", async () => {
      fetchMocks.userRequestVoid.mockRejectedValue(new Error("Network error"));
      await renderWithViews();
      const callsBefore = fetchMocks.serviceGet.mock.calls.length;

      await userEvent.click(screen.getByTestId("delete-v1"));

      await waitFor(() =>
        expect(fetchMocks.serviceGet.mock.calls.length).toBeGreaterThan(
          callsBefore,
        ),
      );
    });
  });

  describe("reconcileViews", () => {
    it("keeps pending views that are not yet present in the backend", async () => {
      const { queryClient } = renderApp();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));
      await userEvent.click(screen.getByTestId("submit-create"));

      // Simulate backend returning no views yet
      await act(async () => {
        queryClient.setQueryData(["views"], []);
      });

      expect(screen.getByTestId("view-item-pending-id")).toBeInTheDocument();
    });

    it("replaces a pending view with the synced one when it appears in the backend", async () => {
      const { queryClient } = renderApp();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));
      await userEvent.click(screen.getByTestId("submit-create"));

      // Simulate backend now returning the real view
      fetchMocks.serviceGet.mockResolvedValue({
        records: [makeSimpleView("real-id", "Pending View")],
      });
      await act(async () => {
        await queryClient.invalidateQueries({ queryKey: ["views"] });
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
