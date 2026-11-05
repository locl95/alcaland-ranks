import { ChevronRight, CircleAlert, LogIn, Plus, User, Loader2, Trash2 } from 'lucide-react';
import './views-list.css';
import { useAppSelector } from '@/app/hooks.ts';
import { selectUsername } from '@/app/authSlice.ts';
import { View } from '@/features/views/model/view.ts';
import { Pager, Pagination } from '@/features/views/components/shared/pager.tsx';
import { useToast } from '@/shared/components/toaster/toast.ts';

export interface LadderListCopy {
  members: string;
  emptyTitle: string;
  emptyText: string;
  signedOutTitle: string;
  signedOutText: string;
}

interface ViewsListProps {
  views: View[];
  isAuthenticated: boolean;
  copy: LadderListCopy;
  isLoadingViews: boolean;
  deletingViewId: string | null;
  onViewClick?: (viewId: string) => void;
  onCreateView: () => void;
  onDeleteView: (viewId: string) => void;
  pagination: Pagination;
}

export function ViewsList({
  views,
  isAuthenticated,
  copy,
  isLoadingViews,
  deletingViewId,
  onViewClick,
  onCreateView,
  onDeleteView,
  pagination,
}: Readonly<ViewsListProps>) {
  const username = useAppSelector(selectUsername);
  const { showInfo } = useToast();
  const pendingViews = views.some((v) => v.status === 'pending');

  if (isLoadingViews && views.length === 0) return null;

  if (views.length === 0) {
    return (
      <div className="views-empty-state">
        <div className="views-empty-content">
          <div className="views-empty-preview" aria-hidden={true}>
            {(['legendary', 'epic', 'rare'] as const).map((tier, i) => (
              <div key={tier} className={`views-empty-ghost-row views-empty-ghost-row--${tier}`}>
                <span className="views-empty-ghost-rank num">{i + 1}</span>
                <span className="views-empty-ghost-name" />
                <span className="views-empty-ghost-score" />
              </div>
            ))}
          </div>
          {isAuthenticated ? (
            <>
              <h3 className="views-empty-title">{copy.emptyTitle}</h3>
              <p className="views-empty-text">{copy.emptyText}</p>
              <button onClick={onCreateView} className="create-view-btn">
                <Plus className="view-row-icon" />
                Create your first ladder
              </button>
            </>
          ) : (
            <>
              <h3 className="views-empty-title">{copy.signedOutTitle}</h3>
              <p className="views-empty-text">{copy.signedOutText}</p>
              <button onClick={onCreateView} className="create-view-btn">
                <LogIn className="view-row-icon" />
                Sign in to get started
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="views-list-container-box">
      <div className="views-list-head">
        <span className="eyebrow">Ladder</span>
        <span className="eyebrow views-list-head-stat">{copy.members}</span>
      </div>
      {views.map((view, index) => {
        const isPending = view.status === 'pending';
        const isDeleting = view.status === 'deleting';
        const isDisabled = isPending || isDeleting;
        const isLast = index === views.length - 1;
        const characterCount = view.simpleView.entitiesIds.length;

        return (
          <div
            key={view.simpleView.id}
            className={['view-row', !isLast && 'with-border', isDisabled && 'view-row-pending']
              .filter(Boolean)
              .join(' ')}
            style={{ '--row-index': index } as React.CSSProperties}
          >
            <button
              type="button"
              className="view-row-open"
              disabled={isDisabled || !onViewClick}
              onClick={() => onViewClick?.(view.simpleView.id)}
            >
              <div className="view-row-content">
                <h3 className="view-row-title">{view.simpleView.name}</h3>

                {isPending && <p className="view-row-description">Synchronizing with server...</p>}
                {isDeleting && <p className="view-row-description">Deleting...</p>}

                {!isDisabled && (
                  <div className="view-row-meta">
                    <div className="view-row-meta-item">
                      <User className="view-row-icon" />
                      <span>{view.simpleView.owner}</span>
                    </div>
                  </div>
                )}
              </div>

              {!isDisabled && (
                <div className="view-row-stat">
                  <span className="view-row-stat-value num">{characterCount}</span>
                </div>
              )}
            </button>

            <div className="view-row-actions">
              {isDisabled && <Loader2 className="loading-icon" />}

              {view.status === 'incomplete' && (
                <button
                  className="view-row-incomplete-btn"
                  title="Still syncing"
                  aria-label="Still syncing"
                  onClick={() =>
                    showInfo(
                      `${view.simpleView.name} is still syncing its ${copy.members.toLowerCase()}. It's already usable and will be complete in a few minutes.`,
                    )
                  }
                >
                  <CircleAlert className="view-row-menu-icon" />
                </button>
              )}

              {!isDisabled && username === view.simpleView.owner && (
                <button
                  className="view-row-delete-btn"
                  title={
                    pendingViews || !!deletingViewId ? 'Cannot delete while syncing' : 'Delete view'
                  }
                  disabled={pendingViews || !!deletingViewId}
                  onClick={() => onDeleteView(view.simpleView.id)}
                >
                  <Trash2 className="view-row-menu-icon" />
                </button>
              )}

              {!isDisabled && onViewClick && (
                <ChevronRight className="view-row-chevron" aria-hidden={true} />
              )}
            </div>
          </div>
        );
      })}
      <Pager label="Ladder list pages" pagination={pagination} />
    </div>
  );
}
