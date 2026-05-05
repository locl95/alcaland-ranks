import { useEffect } from "react";
import { Plus, X } from "lucide-react";
import "./create-view.css";
import { View } from "@/features/views/model/view.ts";
import { RealmSelect } from "@/features/views/components/shared/realm-select.tsx";
import { useCreateViewForm } from "@/features/views/hooks/useCreateViewForm.ts";

interface CreateViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateView: (newView: View) => void;
}

export function CreateView({
  open,
  onOpenChange,
  onCreateView,
}: Readonly<CreateViewDialogProps>) {
  const {
    name,
    setName,
    characters,
    canSubmit,
    error,
    updateCharacter,
    addCharacter,
    removeCharacter,
    handleSubmit,
  } = useCreateViewForm(open, () => onOpenChange(false), onCreateView);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
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

  if (!open) return null;

  return (
    <div
      className="dialog-overlay"
      onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
    >
      <div className="dialog-content">
        <div className="dialog-header">
          <div>
            <h1 className="dialog-title">Create new m+ ladder</h1>
          </div>
          <button
            type="button"
            className="dialog-close-btn"
            onClick={() => onOpenChange(false)}
          >
            <X size={20} />
          </button>
        </div>

        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="form-content">
            <div className="form-field">
              <label className="form-label">Ladder name</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Main Push Team"
              />
            </div>
            <label className="form-label">Characters</label>

            {characters.map((char, index) => (
              <div key={index} className="character-row">
                <input
                  className="form-input"
                  placeholder="Name"
                  value={char.name}
                  onChange={(e) =>
                    updateCharacter(index, "name", e.target.value)
                  }
                />

                <RealmSelect
                  region={char.region}
                  realm={char.realm}
                  onRegionChange={(v) => updateCharacter(index, "region", v)}
                  onRealmChange={(v) => updateCharacter(index, "realm", v)}
                />

                {char.mode === "add" ? (
                  <button
                    type="button"
                    className="btn-icon btn-icon-primary"
                    onClick={() => addCharacter(index)}
                    disabled={!char.name || !char.realm}
                    title="Add"
                  >
                    <Plus size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-icon btn-icon-outline"
                    onClick={() => removeCharacter(index)}
                    title="Remove"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}

            {error && <p className="form-error">{error}</p>}
          </div>

          <div className="dialog-footer">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!canSubmit}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
