import { ChevronRight, Plus, User, Users, AlertTriangle } from "lucide-react";
import "./views-list.css";
import { View } from "@/app/utils/views/View.tsx";

interface ViewsListProps {
  views: View[];
  onViewClick: (viewId: string) => void;
  onCreateView: () => void;
}

export function ViewsList({
  views,
  onViewClick,
  onCreateView,
}: Readonly<ViewsListProps>) {
  return (
        views.length === 0 ? (
          <div className="views-empty-state">
            <div className="views-empty-content">
              <Users className="views-empty-icon" />
              <h3 className="views-empty-title">No views yet</h3>
              <p className="views-empty-text">
                Create your first view to start tracking characters
              </p>
              <button onClick={onCreateView} className="create-view-btn">
                <Plus className="view-row-icon" />
                Create Your First View
              </button>
            </div>
          </div>
        ) : (
          <div className="views-list-container-box">
            {views.map((view, index) => {
              const isPending = !view.isSynced;

              return (
                <div
                  key={view.id}
                  className={`
        view-row
        ${index !== views.length - 1 ? "with-border" : ""}
        ${isPending ? "view-row-pending" : ""}
      `}
                  onClick={() => !isPending && onViewClick(view.id)}
                >
                  <div className="view-row-content">
                    <h3 className="view-row-title">{view.simpleView.name}</h3>

                    <p className="view-row-description">
                      {isPending
                        ? "Synchronizing with server..."
                        : "No description"}
                    </p>

                    <div className="view-row-meta">
                      <div className="view-row-meta-item">
                        <Users className="view-row-icon" />
                        <span>
                          {view.simpleView.entitiesIds.length} character
                          {view.simpleView.entitiesIds.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="view-row-meta-item">
                        <User className="view-row-icon" />
                        <span>{view.simpleView.owner}</span>
                      </div>

                      <span className="view-row-meta-date">
                        Created {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {isPending ? (
                    <AlertTriangle className="warning-icon" />
                  ) : (
                    <ChevronRight className="chevron-icon" />
                  )}
                </div>
              );
            })}
          </div>
        )
  );
}
