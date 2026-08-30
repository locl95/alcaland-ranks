import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/app/authSlice.ts';
import { ViewsList } from './views-list.tsx';
import { View } from '@/features/views/model/view.ts';
import { SimpleView } from '@/features/views/api/view-types.ts';
import { Pagination } from '@/features/views/components/shared/pager.tsx';

const makeSimpleView = (id: string, name: string, owner = 'testuser'): SimpleView => ({
  id,
  name,
  owner,
  published: false,
  entitiesIds: [1, 2],
  game: 'WOW',
  featured: false,
  extraArguments: null,
});

const makeView = (
  id: string,
  name: string,
  status: View['status'] = 'synced',
  owner = 'testuser',
): View => ({
  operationId: status === 'pending' ? id : null,
  simpleView: makeSimpleView(id, name, owner),
  status,
});

const makeStore = (username: string | null = 'testuser') =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        accessToken: username ? 'token' : null,
        refreshToken: null,
        username,
      },
    },
  });

const makePagination = (overrides: Partial<Pagination> = {}): Pagination => ({
  page: 1,
  pageCount: 1,
  startIndex: 0,
  count: 1,
  total: 1,
  goFirst: vi.fn(),
  goPrev: vi.fn(),
  goNext: vi.fn(),
  goLast: vi.fn(),
  ...overrides,
});

const renderList = (
  views: View[],
  options: {
    username?: string | null;
    isLoadingViews?: boolean;
    activeTab?: 'featured' | 'own';
    pagination?: Pagination;
  } = {},
) => {
  const {
    username = 'testuser',
    isLoadingViews = false,
    activeTab = 'own',
    pagination = makePagination(),
  } = options;
  const onViewClick = vi.fn();
  const onCreateView = vi.fn();
  const onDeleteView = vi.fn();

  const result = render(
    <Provider store={makeStore(username)}>
      <ViewsList
        views={views}
        activeTab={activeTab}
        isLoadingViews={isLoadingViews}
        deletingViewId={null}
        onViewClick={onViewClick}
        onCreateView={onCreateView}
        onDeleteView={onDeleteView}
        pagination={pagination}
      />
    </Provider>,
  );

  return { ...result, onViewClick, onCreateView, onDeleteView, pagination };
};

describe('ViewsList', () => {
  describe('empty state', () => {
    it('invites you to create one when you have no ladders of your own', () => {
      renderList([]);
      expect(screen.getByText('No ladders yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first ladder')).toBeInTheDocument();
    });

    it('explains the featured tab instead of offering to create one', () => {
      renderList([], { activeTab: 'featured' });

      expect(screen.getByText('No featured ladders right now')).toBeInTheDocument();
      // Featured ladders are curated, so creating one is not something the
      // reader can do from here.
      expect(screen.queryByText('Create your first ladder')).not.toBeInTheDocument();
    });

    it('calls onCreateView when clicking the create button in empty state', async () => {
      const { onCreateView } = renderList([]);
      await userEvent.click(screen.getByText('Create your first ladder'));
      expect(onCreateView).toHaveBeenCalledOnce();
    });

    it('renders nothing while loading with empty views', () => {
      const { container } = renderList([], { isLoadingViews: true });
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('view rows', () => {
    it('calls onViewClick with the view id when a row is clicked', async () => {
      const { onViewClick } = renderList([makeView('v1', 'My Ladder')]);
      await userEvent.click(screen.getByText('My Ladder'));
      expect(onViewClick).toHaveBeenCalledWith('v1');
    });

    it('displays character count', () => {
      renderList([makeView('v1', 'My Ladder')]);
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
    });

    it('keeps the delete control outside the row button', () => {
      renderList([makeView('v1', 'My Ladder')]);
      const row = screen.getByRole('button', { name: /My Ladder/ });
      expect(row.querySelector('button')).toBeNull();
    });
  });

  describe('pending views', () => {
    it('shows syncing message for pending views', () => {
      renderList([makeView('', 'Pending', 'pending')]);
      expect(screen.getByText('Synchronizing with server...')).toBeInTheDocument();
    });

    it('does not call onViewClick when clicking a pending view', async () => {
      const { onViewClick } = renderList([makeView('', 'Pending', 'pending')]);
      await userEvent.click(screen.getByText('Pending'));
      expect(onViewClick).not.toHaveBeenCalled();
    });
  });

  describe('delete button', () => {
    it('shows delete button for owned views', () => {
      renderList([makeView('v1', 'My Ladder', 'synced', 'testuser')], {
        username: 'testuser',
      });
      expect(screen.getByTitle('Delete view')).toBeInTheDocument();
    });

    it('does not show delete button for views owned by others', () => {
      renderList([makeView('v1', 'Other Ladder', 'synced', 'otherown')], {
        username: 'testuser',
      });
      expect(screen.queryByTitle('Delete view')).not.toBeInTheDocument();
    });

    it('calls onDeleteView when delete button is clicked', async () => {
      const { onDeleteView } = renderList([makeView('v1', 'My Ladder')]);
      await userEvent.click(screen.getByTitle('Delete view'));
      expect(onDeleteView).toHaveBeenCalledWith('v1');
    });

    it('disables delete when another view is syncing', () => {
      renderList([
        makeView('', 'Pending', 'pending', 'testuser'),
        makeView('v2', 'My Ladder', 'synced', 'testuser'),
      ]);
      expect(screen.getByTitle('Cannot delete while syncing')).toBeDisabled();
    });
  });

  describe('paging', () => {
    it('shows no pager when the server returned everything on one page', () => {
      renderList([makeView('v1', 'My Ladder')], {
        pagination: makePagination({ total: 1, pageCount: 1 }),
      });

      expect(screen.queryByRole('navigation', { name: /pages$/i })).not.toBeInTheDocument();
    });

    it('states which ladders are on screen', () => {
      renderList([makeView('v1', 'My Ladder')], {
        pagination: makePagination({ page: 2, pageCount: 5, startIndex: 10, count: 1, total: 45 }),
      });

      expect(screen.getByText('11–11 of 45')).toBeInTheDocument();
    });

    it('counts only what the server sent, not ladders still being created', () => {
      renderList([makeView('v1', 'My Ladder'), makeView('v2', 'Brand New Ladder', 'pending')], {
        pagination: makePagination({ page: 1, pageCount: 5, count: 1, total: 45 }),
      });

      expect(screen.getByText('1–1 of 45')).toBeInTheDocument();
    });

    it('asks for the next page', async () => {
      const { pagination } = renderList([makeView('v1', 'My Ladder')], {
        pagination: makePagination({ page: 1, pageCount: 5, total: 45 }),
      });

      await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

      expect(pagination.goNext).toHaveBeenCalledOnce();
    });
  });
});
