import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/app/authSlice.ts';
import { ViewsList } from './views-list.tsx';
import { View } from '@/features/views/model/view.ts';
import { SimpleView } from '@/features/views/api/view-types.ts';

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

const renderList = (
  views: View[],
  options: {
    username?: string | null;
    isLoadingViews?: boolean;
    activeTab?: 'featured' | 'own';
  } = {},
) => {
  const { username = 'testuser', isLoadingViews = false, activeTab = 'own' } = options;
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
      />
    </Provider>,
  );

  return { ...result, onViewClick, onCreateView, onDeleteView };
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
});
