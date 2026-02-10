import {ChevronRight, User, Users} from "lucide-react";
import {SimpleView} from "../utils/views/SimpleView";

interface ViewsListProps {
    views: SimpleView[];
    onViewClick: (viewId: string) => void;
}

const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    border: "1px solid #334155",
    borderRadius: "8px",
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    cursor: "pointer",
};

const leftStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
};

const metaRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    fontSize: "14px",
    color: "#cbd5f5",
};

const metaItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
};

export function ViewsList({views, onViewClick}: ViewsListProps) {
    return (
        <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
            {views.map((view) => (
                <div
                    key={view.id}
                    style={rowStyle}
                    onClick={() => onViewClick(view.id)}
                >
                    <div style={leftStyle}>
                        <h3 style={{margin: 0, color: "white"}}>{view.name}</h3>

                        <p style={{margin: 0, fontSize: "14px", color: "#94a3b8"}}>
                            No description
                        </p>

                        <div style={metaRowStyle}>
                            <div style={metaItemStyle}>
                                <Users size={16}/>
                                <span>
                  {view.entitiesIds.length} character
                                    {view.entitiesIds.length !== 1 ? "s" : ""}
                </span>
                            </div>

                            <div style={metaItemStyle}>
                                <User size={16}/>
                                <span>By Sanxei</span>
                            </div>

                            <span style={{color: "#94a3b8"}}>
                Created {new Date().toLocaleDateString()}
              </span>
                        </div>
                    </div>

                    <ChevronRight size={20} color="#94a3b8"/>
                </div>
            ))}
        </div>
    );
}
