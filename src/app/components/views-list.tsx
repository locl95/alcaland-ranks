import { ChevronRight, Plus, User, Users } from "lucide-react";
import "./views-list.css";
import { SimpleView } from "../utils/views/SimpleView";

interface ViewsListProps {
  views: SimpleView[];
  onViewClick: (viewId: string) => void;
  onCreateView: () => void;
}

export function ViewsList({
  views,
  onViewClick,
  onCreateView,
}: Readonly<ViewsListProps>) {
  return (
    <div className="views-list-container">
      <div className="views-list-content">
        <div className="views-header">
          <div className="views-header-text">
            <h1>Mythic+ Tracker</h1>
            <p>Track your characters' dungeon progression</p>
          </div>
          <button onClick={onCreateView} className="create-view-btn">
            <Plus className="icon-lg" />
            Create View
          </button>
        </div>

        {views.length === 0 ? (
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
            {views.map((view, index) => (
              <div
                key={view.id}
                className={`view-row ${index !== views.length - 1 ? "with-border" : ""}`}
                onClick={() => onViewClick(view.id)}
              >
                <div className="view-row-content">
                  <h3 className="view-row-title">{view.name}</h3>
                  <p className="view-row-description">{"No description"}</p>
                  <div className="view-row-meta">
                    <div className="view-row-meta-item">
                      <Users className="view-row-icon" />
                      <span>
                        {view.entitiesIds.length} character
                        {view.entitiesIds.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="view-row-meta-item">
                      <User className="view-row-icon" />
                      <span>By {view.owner}</span>
                    </div>
                    <span className="view-row-meta-date">
                      Created {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ChevronRight className="chevron-icon" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
