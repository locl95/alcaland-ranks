import { useState, useEffect } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/shared/components/toaster/ToastProvider.tsx';
import { ViewsPage } from './views-page.tsx';
import { GameContext } from '@/shared/game/game.ts';
import authReducer from '@/app/authSlice.ts';
import { MockViewsList, MockCreateView, makeSimpleView } from '@/app/App.mocks.tsx';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const fetchMocks = vi.hoisted(() => ({
  serviceGet: vi.fn(),
  userRequest: vi.fn(),
  userRequestVoid: vi.fn(),
}));

const navState = vi.hoisted(() => {
  let path = '/';
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
      path = '/';
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
vi.mock('react-router-dom', () => ({
  useNavigate: () => (to: string) => navState.navigate(to),
  useLocation: () => ({ pathname: navState.path, state: null }),
}));

vi.mock('@/shared/api/httpClient.ts', () => fetchMocks);

vi.mock('@/features/auth/authApi.ts', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/features/views/components/views-page/views-list.tsx', () => ({
  ViewsList: (props: Parameters<typeof MockViewsList>[0]) => <MockViewsList {...props} />,
}));

vi.mock('@/features/views/components/views-page/actions/create-view.tsx', () => ({
  CreateView: (props: Parameters<typeof MockCreateView>[0]) => <MockCreateView {...props} />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const createStore = (authenticated = true) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: authenticated
        ? {
            accessToken: 'test-token',
            refreshToken: 'test-refresh',
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

  render(
    <Provider store={store}>
      <QueryClientProvider client={testQueryClient}>
        <ToastProvider>
          <GameContext.Provider value="wow">
            <Wrapper />
          </GameContext.Provider>
        </ToastProvider>
      </QueryClientProvider>
    </Provider>,
  );
};

// Own views use userRequest.
const renderWithViews = async (views = [makeSimpleView('v1', 'My View')]) => {
  fetchMocks.userRequest.mockResolvedValue({ records: views });
  renderViewsPage();
  await waitFor(() => screen.getByTestId(`view-item-${views[0].id}`));
};

describe('ViewsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navState.reset();
    fetchMocks.serviceGet.mockResolvedValue({ records: [] });
    fetchMocks.userRequest.mockResolvedValue({ records: [] });
    fetchMocks.userRequestVoid.mockResolvedValue(undefined);
  });

  afterEach(() => vi.unstubAllEnvs());

  describe('fetching views on mount', () => {
    it('fetches no views when unauthenticated', async () => {
      renderViewsPage(false);
      await waitFor(() => screen.getByTestId('views-list'));
      expect(fetchMocks.userRequest).not.toHaveBeenCalled();
      expect(fetchMocks.serviceGet).not.toHaveBeenCalledWith(expect.stringContaining('/views?'));
    });
  });

  describe('Create View dialog', () => {
    it('opens the create dialog when triggered from ViewsList', async () => {
      renderViewsPage();
      await waitFor(() => screen.getByTestId('list-create-btn'));

      await userEvent.click(screen.getByTestId('list-create-btn'));

      expect(screen.getByTestId('create-view-dialog')).toBeInTheDocument();
    });

    it('redirects unauthenticated users to login when clicking create', async () => {
      renderViewsPage(false);
      await waitFor(() => screen.getByTestId('list-create-btn'));

      await userEvent.click(screen.getByTestId('list-create-btn'));

      expect(navState.path).toBe('/login');
    });
  });

  describe('handleViewClick', () => {
    it('navigates to the view detail screen', async () => {
      await renderWithViews();
      await userEvent.click(screen.getByTestId('open-v1'));

      expect(navState.path).toBe('/wow/v1');
    });
  });
});
