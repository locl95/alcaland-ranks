import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ViewDetail } from "./view-detail.tsx";
import authReducer from "@/app/authSlice.ts";
import { viewKeys } from "@/features/views/api/viewQueries.ts";

const TEST_VIEW_ID = "00000000-0000-0000-0000-000000000001";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const fetchMocks = vi.hoisted(() => ({
  serviceGet: vi.fn(),
  userRequestVoid: vi.fn(),
}));

const navMock = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("react-router-dom", () => ({
  useNavigate: () => navMock.navigate,
  useParams: () => ({ viewId: TEST_VIEW_ID }),
  useLocation: () => ({ pathname: `/${TEST_VIEW_ID}`, state: null }),
}));

vi.mock("@/shared/api/httpClient.ts", () => fetchMocks);

vi.mock("./character-ladder/character-ladder.tsx", () => ({ CharacterLadder: () => null }));
vi.mock("./dungeon-grid/dungeon-grid.tsx", () => ({ DungeonGrid: () => null }));
vi.mock("./actions/edit-view.tsx", () => ({ EditView: () => null }));
vi.mock("./actions/sync-error-dialog.tsx", () => ({ SyncErrorDialog: () => null }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const createStore = () =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { accessToken: null, refreshToken: null, username: null },
    },
  });

const renderViewDetail = () => {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  // Pre-populate viewData so isLoading is false immediately
  testQueryClient.setQueryData(viewKeys.data(TEST_VIEW_ID), {
    viewName: "Test View",
    data: [],
  });

  fetchMocks.serviceGet.mockResolvedValue({ viewName: "Test View", data: [] });

  return render(
    <Provider store={createStore()}>
      <QueryClientProvider client={testQueryClient}>
        <ViewDetail />
      </QueryClientProvider>
    </Provider>,
  );
};

describe("ViewDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("back navigation", () => {
    it("navigates back to / when the back button is clicked", async () => {
      renderViewDetail();

      await waitFor(() =>
        expect(document.querySelector(".header-back-button")).toBeInTheDocument(),
      );

      await userEvent.click(document.querySelector(".header-back-button") as HTMLElement);

      expect(navMock.navigate).toHaveBeenCalledWith("/");
    });
  });
});
