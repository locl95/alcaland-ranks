import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import loadingReducer from '@/features/loading/loadingSlice.ts';
import type { View } from '@/features/views/model/View.tsx';

// ---------------------------------------------------------------------------
// Hoisted mocks – must be defined before vi.mock() factories run
// ---------------------------------------------------------------------------
const pollingCapture = vi.hoisted(() => ({
  shouldContinue: null as ((result: View[]) => boolean) | null,
  start: vi.fn(),
  stop: vi.fn(),
}));

const fetchMocks = vi.hoisted(() => ({
  fetchWithResponse: vi.fn(),
  fetchWithoutResponse: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock('@/shared/hooks/usePolling.tsx', () => ({
  usePolling: vi.fn((options: { shouldContinue: (r: View[]) => boolean }) => {
    pollingCapture.shouldContinue = options.shouldContinue;
    return { start: pollingCapture.start, stop: pollingCapture.stop };
  }),
}));

vi.mock('@/shared/api/EasyFetch.ts', () => fetchMocks);

vi.mock('@/features/views/components/views-list.tsx', () => ({
  ViewsList: ({
    views,
    onViewClick,
    onCreateView,
    onDeleteView,
  }: {
    views: View[];
    onViewClick: (id: string) => void;
    onCreateView: () => void;
    onDeleteView: (id: string) => void;
  }) => (
    <div data-testid="views-list">
      {views.map((v) => (
        <div key={v.id} data-testid={`view-item-${v.id}`}>
          <button data-testid={`open-${v.id}`} onClick={() => onViewClick(v.id)}>
            Open {v.simpleView.name}
          </button>
          <button data-testid={`delete-${v.id}`} onClick={() => onDeleteView(v.id)}>
            Delete {v.simpleView.name}
          </button>
        </div>
      ))}
      <button data-testid="list-create-btn" onClick={onCreateView}>
        Create from list
      </button>
    </div>
  ),
}));

vi.mock('@/features/views/components/create-view.tsx', () => ({
  CreateView: ({
    open,
    onCreateView,
    onOpenChange,
  }: {
    open: boolean;
    onCreateView: (v: View) => void;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div data-testid="create-view-dialog">
        <button
          data-testid="submit-create"
          onClick={() =>
            onCreateView({
              id: 'pending-id',
              simpleView: {
                id: 'pending-id',
                name: 'Pending View',
                owner: 'testuser',
                published: false,
                entitiesIds: [],
                game: 'WOW',
                featured: false,
              } as View['simpleView'],
              isSynced: false,
            })
          }
        >
          Submit
        </button>
        <button data-testid="close-dialog" onClick={() => onOpenChange(false)}>
          Close
        </button>
      </div>
    ) : null,
}));

vi.mock('@/features/views/components/view-detail.tsx', () => ({
  ViewDetail: ({
    view,
    onBack,
  }: {
    view: View['simpleView'];
    onBack: () => void;
  }) => (
    <div data-testid="view-detail">
      <span data-testid="view-detail-name">{view.name}</span>
      <button data-testid="back-btn" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const createStore = () => configureStore({ reducer: { loading: loadingReducer } });

const renderApp = () =>
  render(
    <Provider store={createStore()}>
      <App />
    </Provider>,
  );

const makeSimpleView = (id: string, name: string) => ({
  id,
  name,
  owner: 'testuser',
  published: false,
  entitiesIds: [],
  game: 'WOW',
  featured: false,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pollingCapture.shouldContinue = null;
    fetchMocks.fetchWithResponse.mockResolvedValue({ records: [] });
    fetchMocks.fetchWithoutResponse.mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  describe('initial render', () => {
    it('renders the views list screen', async () => {
      renderApp();
      await waitFor(() => expect(screen.getByTestId('views-list')).toBeInTheDocument());
    });

    it('shows the app title', async () => {
      renderApp();
      await waitFor(() =>
        expect(screen.getByText('Mythic+ ladder tracker')).toBeInTheDocument(),
      );
    });

    it('shows the current season label', async () => {
      renderApp();
      await waitFor(() =>
        expect(screen.getByText('Midnight Season 1')).toBeInTheDocument(),
      );
    });
  });

  // -------------------------------------------------------------------------
  describe('fetching views on mount', () => {
    it('calls fetchWithResponse with the correct endpoint', async () => {
      renderApp();
      await waitFor(() =>
        expect(fetchMocks.fetchWithResponse).toHaveBeenCalledWith(
          'GET',
          '/views?game=wow',
          undefined,
          expect.stringContaining('Bearer'),
        ),
      );
    });

    it('displays fetched views', async () => {
      fetchMocks.fetchWithResponse.mockResolvedValue({
        records: [makeSimpleView('v1', 'My View')],
      });
      renderApp();
      await waitFor(() => expect(screen.getByTestId('view-item-v1')).toBeInTheDocument());
    });
  });

  // -------------------------------------------------------------------------
  describe('Create View button', () => {
    it('shows header Create View button when views exist', async () => {
      fetchMocks.fetchWithResponse.mockResolvedValue({
        records: [makeSimpleView('v1', 'View 1')],
      });
      renderApp();
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /create view/i })).toBeInTheDocument(),
      );
    });

    it('does not show header Create View button when there are no views', async () => {
      renderApp();
      await waitFor(() => screen.getByTestId('views-list'));
      expect(screen.queryByRole('button', { name: /create view/i })).not.toBeInTheDocument();
    });

    it('opens the create dialog when the header button is clicked', async () => {
      fetchMocks.fetchWithResponse.mockResolvedValue({
        records: [makeSimpleView('v1', 'View 1')],
      });
      renderApp();
      await waitFor(() => screen.getByRole('button', { name: /create view/i }));

      await userEvent.click(screen.getByRole('button', { name: /create view/i }));

      expect(screen.getByTestId('create-view-dialog')).toBeInTheDocument();
    });

    it('opens the create dialog when triggered from ViewsList', async () => {
      renderApp();
      await waitFor(() => screen.getByTestId('list-create-btn'));

      await userEvent.click(screen.getByTestId('list-create-btn'));

      expect(screen.getByTestId('create-view-dialog')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  describe('handleCreateView', () => {
    it('adds the pending view to the list', async () => {
      renderApp();
      await waitFor(() => screen.getByTestId('list-create-btn'));

      await userEvent.click(screen.getByTestId('list-create-btn'));
      await userEvent.click(screen.getByTestId('submit-create'));

      expect(screen.getByTestId('view-item-pending-id')).toBeInTheDocument();
    });

    it('starts polling when VITE_FEATURE_FLAG_POLLING_ENABLED is true', async () => {
      vi.stubEnv('VITE_FEATURE_FLAG_POLLING_ENABLED', 'true');
      renderApp();
      await waitFor(() => screen.getByTestId('list-create-btn'));

      await userEvent.click(screen.getByTestId('list-create-btn'));
      await userEvent.click(screen.getByTestId('submit-create'));

      expect(pollingCapture.start).toHaveBeenCalled();
      vi.unstubAllEnvs();
    });

    it('does not start polling when VITE_FEATURE_FLAG_POLLING_ENABLED is not true', async () => {
      vi.stubEnv('VITE_FEATURE_FLAG_POLLING_ENABLED', 'false');
      renderApp();
      await waitFor(() => screen.getByTestId('list-create-btn'));

      await userEvent.click(screen.getByTestId('list-create-btn'));
      await userEvent.click(screen.getByTestId('submit-create'));

      expect(pollingCapture.start).not.toHaveBeenCalled();
      vi.unstubAllEnvs();
    });
  });

  // -------------------------------------------------------------------------
  describe('handleViewClick', () => {
    it('navigates to the view-detail screen', async () => {
      fetchMocks.fetchWithResponse.mockResolvedValue({
        records: [makeSimpleView('v1', 'My View')],
      });
      renderApp();
      await waitFor(() => screen.getByTestId('open-v1'));

      await userEvent.click(screen.getByTestId('open-v1'));

      expect(screen.getByTestId('view-detail')).toBeInTheDocument();
      expect(screen.queryByTestId('views-list')).not.toBeInTheDocument();
    });

    it('passes the correct view data to ViewDetail', async () => {
      fetchMocks.fetchWithResponse.mockResolvedValue({
        records: [makeSimpleView('v1', 'My View')],
      });
      renderApp();
      await waitFor(() => screen.getByTestId('open-v1'));

      await userEvent.click(screen.getByTestId('open-v1'));

      expect(screen.getByTestId('view-detail-name')).toHaveTextContent('My View');
    });
  });

  // -------------------------------------------------------------------------
  describe('handleBackToViews', () => {
    const goToViewDetail = async () => {
      fetchMocks.fetchWithResponse.mockResolvedValue({
        records: [makeSimpleView('v1', 'My View')],
      });
      renderApp();
      await waitFor(() => screen.getByTestId('open-v1'));
      await userEvent.click(screen.getByTestId('open-v1'));
    };

    it('navigates back to the views list', async () => {
      await goToViewDetail();

      await userEvent.click(screen.getByTestId('back-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('views-list')).toBeInTheDocument();
        expect(screen.queryByTestId('view-detail')).not.toBeInTheDocument();
      });
    });

    it('stops polling when navigating back', async () => {
      await goToViewDetail();

      await userEvent.click(screen.getByTestId('back-btn'));

      expect(pollingCapture.stop).toHaveBeenCalled();
    });

    it('re-fetches views when navigating back', async () => {
      await goToViewDetail();
      const callsBefore = fetchMocks.fetchWithResponse.mock.calls.length;

      await userEvent.click(screen.getByTestId('back-btn'));

      await waitFor(() =>
        expect(fetchMocks.fetchWithResponse.mock.calls.length).toBeGreaterThan(callsBefore),
      );
    });
  });

  // -------------------------------------------------------------------------
  describe('handleDeleteView', () => {
    it('removes the view from the list optimistically', async () => {
      fetchMocks.fetchWithResponse.mockResolvedValue({
        records: [makeSimpleView('v1', 'My View')],
      });
      renderApp();
      await waitFor(() => screen.getByTestId('delete-v1'));

      await userEvent.click(screen.getByTestId('delete-v1'));

      expect(screen.queryByTestId('view-item-v1')).not.toBeInTheDocument();
    });

    it('calls the DELETE API with the correct viewId', async () => {
      fetchMocks.fetchWithResponse.mockResolvedValue({
        records: [makeSimpleView('v1', 'My View')],
      });
      renderApp();
      await waitFor(() => screen.getByTestId('delete-v1'));

      await userEvent.click(screen.getByTestId('delete-v1'));

      await waitFor(() =>
        expect(fetchMocks.fetchWithoutResponse).toHaveBeenCalledWith(
          'DELETE',
          '/views/v1',
          undefined,
          expect.stringContaining('Bearer'),
        ),
      );
    });

    it('re-fetches views when the DELETE API call fails', async () => {
      fetchMocks.fetchWithResponse.mockResolvedValue({
        records: [makeSimpleView('v1', 'My View')],
      });
      fetchMocks.fetchWithoutResponse.mockRejectedValue(new Error('Network error'));
      renderApp();
      await waitFor(() => screen.getByTestId('delete-v1'));
      const callsBefore = fetchMocks.fetchWithResponse.mock.calls.length;

      await userEvent.click(screen.getByTestId('delete-v1'));

      await waitFor(() =>
        expect(fetchMocks.fetchWithResponse.mock.calls.length).toBeGreaterThan(callsBefore),
      );
    });
  });

  // -------------------------------------------------------------------------
  describe('reconcileViews (via polling shouldContinue)', () => {
    it('keeps pending views that are not yet present in the backend', async () => {
      renderApp();
      await waitFor(() => screen.getByTestId('list-create-btn'));

      await userEvent.click(screen.getByTestId('list-create-btn'));
      await userEvent.click(screen.getByTestId('submit-create'));
      expect(screen.getByTestId('view-item-pending-id')).toBeInTheDocument();

      // Backend returns nothing yet – pending view should remain
      act(() => {
        pollingCapture.shouldContinue!([]);
      });

      expect(screen.getByTestId('view-item-pending-id')).toBeInTheDocument();
    });

    it('replaces a pending view with the synced one when it appears in the backend', async () => {
      renderApp();
      await waitFor(() => screen.getByTestId('list-create-btn'));

      await userEvent.click(screen.getByTestId('list-create-btn'));
      await userEvent.click(screen.getByTestId('submit-create'));

      const backendViews: View[] = [
        {
          id: 'real-id',
          simpleView: makeSimpleView('real-id', 'Pending View') as View['simpleView'],
          isSynced: true,
        },
      ];

      act(() => {
        pollingCapture.shouldContinue!(backendViews);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('view-item-pending-id')).not.toBeInTheDocument();
        expect(screen.getByTestId('view-item-real-id')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('cleanup', () => {
    it('stops polling when the component unmounts', async () => {
      const { unmount } = renderApp();
      await waitFor(() => screen.getByTestId('views-list'));

      unmount();

      expect(pollingCapture.stop).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  describe('navigation effect', () => {
    it('navigates back to views list when the currently viewed view disappears from state', async () => {
      fetchMocks.fetchWithResponse.mockResolvedValue({
        records: [makeSimpleView('v1', 'My View')],
      });
      renderApp();
      await waitFor(() => screen.getByTestId('open-v1'));
      await userEvent.click(screen.getByTestId('open-v1'));
      expect(screen.getByTestId('view-detail')).toBeInTheDocument();

      // Polling callback: backend no longer returns v1
      act(() => {
        pollingCapture.shouldContinue!([]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('views-list')).toBeInTheDocument();
        expect(screen.queryByTestId('view-detail')).not.toBeInTheDocument();
      });
    });
  });
});
