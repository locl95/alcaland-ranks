import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { viewKeys } from '@/features/views/api/viewQueries.ts';
import { Plus, User, LogOut, X, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { useAppSelector } from '@/app/hooks.ts';
import { selectIsAuthenticated, selectUsername } from '@/app/authSlice.ts';
import { logout } from '@/features/auth/authApi.ts';
import { useStaticData } from '@/features/views/hooks/useStaticData.ts';
import { useViewsData } from '@/features/views/hooks/useViewsData.ts';
import { GameSwitcher } from '@/shared/components/game-switcher.tsx';
import { useGame } from '@/shared/game/game.ts';
import keystone from '@/assets/keystone.webp';
import { ViewsList } from './views-list.tsx';
import { CreateView } from './actions/create-view.tsx';
import './views-page.css';

export function ViewsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const game = useGame();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectUsername);

  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: season } = useStaticData();

  const {
    ownViews: views,
    isLoadingOwn: isLoadingViews,
    ownPagination: pagination,
    createView,
    deleteView,
    deletingViewId,
    createError,
    clearCreateError,
  } = useViewsData(isAuthenticated, game);

  const isSyncing = views.some((v) => v.status === 'pending');

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    action();
  };

  const handleViewClick = (viewId: string) => {
    const view = views.find((v) => v.simpleView.id === viewId);
    navigate(`/${game}/${viewId}`, {
      state: {
        owner: view?.simpleView.owner,
        isGuild: view?.simpleView.extraArguments?.isGuild ?? false,
        entitiesCount: view?.simpleView.entitiesIds.length ?? 0,
      },
    });
  };

  const handleCreateClick = () => requireAuth(() => setIsCreateDialogOpen(true));

  const handleDeleteView = (viewId: string) => requireAuth(() => deleteView(viewId));

  const handleLogout = async () => {
    await logout();
    queryClient.removeQueries({ queryKey: viewKeys.ownList() });
    navigate(`/${game}`);
  };

  return (
    <div className="page">
      <div className="page-inner">
        <GameSwitcher />
        <header className="masthead">
          <div className="masthead-brand">
            <img src={keystone} alt="" aria-hidden={true} className="masthead-mark" />
            <div className="masthead-lines">
              <h1 className="masthead-title">Mythic+ ladder tracker</h1>
              {season?.name && (
                <p className="masthead-season">
                  <span className="eyebrow">Season</span>
                  <span className="masthead-season-name">{season.name}</span>
                </p>
              )}
            </div>
          </div>

          <div className="masthead-actions">
            <button
              onClick={handleCreateClick}
              className="create-view-btn"
              disabled={isSyncing}
              title={isSyncing ? 'Wait for sync to complete' : undefined}
            >
              <Plus className="icon-lg" />
              <span className="create-view-btn-label">Ladder</span>
            </button>

            {isAuthenticated && username && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="user-menu-btn" aria-label={`Account: ${username}`}>
                    <User className="user-menu-icon" />
                    <ChevronDown className="user-menu-chevron" aria-hidden={true} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent
                    className="user-menu-content"
                    align="end"
                    sideOffset={6}
                    collisionPadding={12}
                  >
                    <DropdownMenuLabel className="user-menu-identity">
                      <span className="eyebrow">Signed in as</span>
                      <span className="user-menu-identity-name">{username}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="user-menu-separator" />
                    <DropdownMenuItem
                      className="user-menu-item user-menu-item--danger"
                      onSelect={handleLogout}
                    >
                      <LogOut className="user-menu-item-icon" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenu>
            )}
          </div>
        </header>

        {createError && (
          <div className="create-error-banner" role="alert">
            <span>{createError}</span>
            <button
              className="create-error-dismiss"
              onClick={clearCreateError}
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <ViewsList
          views={views}
          isAuthenticated={isAuthenticated}
          isLoadingViews={isLoadingViews}
          deletingViewId={deletingViewId}
          onViewClick={handleViewClick}
          onCreateView={handleCreateClick}
          onDeleteView={handleDeleteView}
          pagination={pagination}
        />
      </div>

      {isCreateDialogOpen && (
        <CreateView onClose={() => setIsCreateDialogOpen(false)} onCreateView={createView} />
      )}
    </div>
  );
}
