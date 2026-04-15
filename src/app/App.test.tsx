import { useState, useEffect } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import App from "./App";
import loadingReducer from "@/app/loadingSlice.ts";
import authReducer from "@/app/authSlice.ts";
import type { View } from "@/features/views/model/view.ts";
import {
  MockViewsList,
  MockCreateView,
  MockViewDetail,
  makeSimpleView,
} from "@/app/App.mocks.tsx";

// ---------------------------------------------------------------------------
// Hoisted mocks – must be defined before vi.mock() factories run
// ---------------------------------------------------------------------------
const pollingCapture = vi.hoisted(() => ({
  shouldContinue: null as ((result: View[]) => boolean) | null,
  start: vi.fn(),
  stop: vi.fn(),
}));

const fetchMocks = vi.hoisted(() => ({
  serviceGet: vi.fn(),
  userRequestVoid: vi.fn(),
}));

// Lightweight in-memory router to avoid the React 18/19 version conflict that
// arises when importing MemoryRouter from the globally-resolved react-router v7.
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

vi.mock("@/shared/hooks/usePolling.tsx", () => ({
  usePolling: vi.fn((options: { shouldContinue: (r: View[]) => boolean }) => {
    pollingCapture.shouldContinue = options.shouldContinue;
    return { start: pollingCapture.start, stop: pollingCapture.stop };
  }),
}));

vi.mock("@/shared/api/httpClient.ts", () => fetchMocks);

vi.mock("@/features/views/components/views-page/views-list.tsx", () => ({
  ViewsList: (props: Parameters<typeof MockViewsList>[0]) => (
    <MockViewsList {...props} />
  ),
}));

vi.mock("@/features/views/components/views-page/create-view.tsx", () => ({
  CreateView: (props: Parameters<typeof MockCreateView>[0]) => (
    <MockCreateView {...props} />
  ),
}));

vi.mock("@/features/views/components/view-detail/view-detail.tsx", () => ({
  ViewDetail: (props: { onBack: () => void }) => <MockViewDetail {...props} />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const createStore = () =>
  configureStore({
    reducer: { loading: loadingReducer, auth: authReducer },
    preloadedState: { auth: { accessToken: "test-token", refreshToken: "test-refresh" } },
  });

const renderApp = () => {
  const store = createStore();
  function TestRouter() {
    const [, tick] = useState(0);
    useEffect(() => navState.subscribe(() => tick((n) => n + 1)), []);
    return <App />;
  }
  return render(
    <Provider store={store}>
      <TestRouter />
    </Provider>,
  );
};

const renderWithViews = async (views = [makeSimpleView("v1", "My View")]) => {
  fetchMocks.serviceGet.mockResolvedValue({ records: views });
  const result = renderApp();
  await waitFor(() => screen.getByTestId("views-list"));
  return result;
};

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pollingCapture.shouldContinue = null;
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

    it("starts polling when VITE_FEATURE_FLAG_POLLING_ENABLED is true", async () => {
      vi.stubEnv("VITE_FEATURE_FLAG_POLLING_ENABLED", "true");
      renderApp();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));
      await userEvent.click(screen.getByTestId("submit-create"));

      expect(pollingCapture.start).toHaveBeenCalled();
    });

    it("does not start polling when VITE_FEATURE_FLAG_POLLING_ENABLED is not true", async () => {
      vi.stubEnv("VITE_FEATURE_FLAG_POLLING_ENABLED", "false");
      renderApp();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));
      await userEvent.click(screen.getByTestId("submit-create"));

      expect(pollingCapture.start).not.toHaveBeenCalled();
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

    it("stops polling when navigating back", async () => {
      await goToViewDetail();
      await userEvent.click(screen.getByTestId("back-btn"));

      expect(pollingCapture.stop).toHaveBeenCalled();
    });
  });

  describe("handleDeleteView", () => {
    it("removes the view from the list optimistically", async () => {
      await renderWithViews();
      await userEvent.click(screen.getByTestId("delete-v1"));

      expect(screen.queryByTestId("view-item-v1")).not.toBeInTheDocument();
    });

    it("calls the DELETE API with the correct viewId", async () => {
      await renderWithViews();
      await userEvent.click(screen.getByTestId("delete-v1"));

      await waitFor(() =>
        expect(fetchMocks.userRequestVoid).toHaveBeenCalledWith("DELETE", "/views/v1"),
      );
    });

    it("re-fetches views when the DELETE API call fails", async () => {
      fetchMocks.userRequestVoid.mockRejectedValue(new Error("Network error"));
      await renderWithViews();
      const callsBefore = fetchMocks.serviceGet.mock.calls.length;

      await userEvent.click(screen.getByTestId("delete-v1"));

      await waitFor(() =>
        expect(fetchMocks.serviceGet.mock.calls.length).toBeGreaterThan(callsBefore),
      );
    });
  });

  describe("reconcileViews (via polling shouldContinue)", () => {
    it("keeps pending views that are not yet present in the backend", async () => {
      renderApp();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));
      await userEvent.click(screen.getByTestId("submit-create"));

      act(() => {
        pollingCapture.shouldContinue!([]);
      });

      expect(screen.getByTestId("view-item-pending-id")).toBeInTheDocument();
    });

    it("replaces a pending view with the synced one when it appears in the backend", async () => {
      renderApp();
      await waitFor(() => screen.getByTestId("list-create-btn"));

      await userEvent.click(screen.getByTestId("list-create-btn"));
      await userEvent.click(screen.getByTestId("submit-create"));

      const backendViews: View[] = [
        {
          id: "real-id",
          simpleView: makeSimpleView("real-id", "Pending View"),
          isSynced: true,
        },
      ];

      act(() => {
        pollingCapture.shouldContinue!(backendViews);
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId("view-item-pending-id"),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId("view-item-real-id")).toBeInTheDocument();
      });
    });
  });

  describe("cleanup", () => {
    it("stops polling when the component unmounts", async () => {
      const { unmount } = renderApp();
      await waitFor(() => screen.getByTestId("views-list"));

      unmount();

      expect(pollingCapture.stop).toHaveBeenCalled();
    });
  });
});
