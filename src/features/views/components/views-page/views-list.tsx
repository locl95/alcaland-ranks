import { ChevronRight, Plus, User, Users, Loader2, Trash2 } from 'lucide-react';
import './views-list.css';
import { useAppSelector } from '@/app/hooks.ts';
import { selectUsername } from '@/app/authSlice.ts';
import { View } from '@/features/views/model/view.ts';

interface ViewsListProps {
  views: View[];
  isLoadingViews: boolean;
  deletingViewId: string | null;
  onViewClick: (viewId: string) => void;
  onCreateView: () => void;
  onDeleteView: (viewId: string) => void;
}

export function ViewsList({
  views,
  isLoadingViews,
  deletingViewId,
  onViewClick,
  onCreateView,
  onDeleteView,
}: Readonly<ViewsListProps>) {
  const username = useAppSelector(selectUsername);
  const pendingViews = views.some((v) => v.status === 'pending');

  if (isLoadingViews && views.length === 0) return null;

  return views.length === 0 ? (
    <div className="views-empty-state">
      <div className="views-empty-content">
        <Users className="views-empty-icon" />
        <h3 className="views-empty-title">No views yet</h3>
        <p className="views-empty-text">Create your first ladder to start tracking characters</p>
        <button onClick={onCreateView} className="create-view-btn">
          <Plus className="view-row-icon" />
          Create your first ladder
        </button>
      </div>
    </div>
  ) : (
    <div className="views-list-container-box">
      <div className="views-list-head">
        <span className="eyebrow">Ladder</span>
        <span className="eyebrow views-list-head-stat">Characters</span>
      </div>
      {views.map((view, index) => {
        const isPending = view.status === 'pending';
        const isDeleting = view.status === 'deleting';
        const isDisabled = isPending || isDeleting;
        const isLast = index === views.length - 1;
        const characterCount = view.simpleView.entitiesIds.length;
        const open = () => !isDisabled && onViewClick(view.simpleView.id);

        return (
          <div
            key={view.simpleView.id}
            role="button"
            tabIndex={isDisabled ? -1 : 0}
            aria-disabled={isDisabled}
            className={['view-row', !isLast && 'with-border', isDisabled && 'view-row-pending']
              .filter(Boolean)
              .join(' ')}
            onClick={open}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open();
              }
            }}
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

            <div className="view-row-actions" onClick={(e) => e.stopPropagation()}>
              {isDisabled && <Loader2 className="loading-icon" />}

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

              {!isDisabled && <ChevronRight className="view-row-chevron" aria-hidden={true} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
