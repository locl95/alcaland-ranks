import { useState, useEffect } from "react";
import "./create-view-dialog.css";

interface CreateViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateView: (name: string, description: string) => void;
}

export function CreateViewDialog({
  open,
  onOpenChange,
  onCreateView,
}: CreateViewDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateView(name, description);
      setName("");
      setDescription("");
      onOpenChange(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-content">
        <div className="dialog-header">
          <h2 className="dialog-title">Create New View</h2>
          <p className="dialog-description">
            Create a new view to track your characters' Mythic+ progress
          </p>
        </div>
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-content">
            <div className="form-field">
              <label htmlFor="name" className="form-label">
                View Name
              </label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="e.g., Main Push Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                className="form-textarea"
                placeholder="e.g., Our competitive push team for Season 1"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="dialog-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim()}
            >
              Create View
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
