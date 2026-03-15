import { useState, useEffect } from "react";
import "./create-view.css";
import { fetchWithResponse } from "@/app/utils/EasyFetch.ts";
import { CreateViewRequest } from "@/app/utils/views/CreateViewRequest.tsx";
import { View } from "@/app/utils/views/View.tsx";

interface CreateViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateView: (newView: View) => void;
}

interface CharacterRow {
  name: string;
  realm: string;
  region: string;
  mode: "add" | "added";
}

export function CreateView({
  open,
  onOpenChange,
  onCreateView,
}: Readonly<CreateViewDialogProps>) {
  const [name, setName] = useState("");

  const [characters, setCharacters] = useState<CharacterRow[]>([
    { name: "", realm: "", region: "", mode: "add" },
  ]);

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

    if (!open) resetForm();

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  const updateCharacter = (index: number, field: string, value: string) => {
    const updated = [...characters];
    updated[index] = { ...updated[index], [field]: value };
    setCharacters(updated);
  };

  const resetForm = () => {
    setName("");
    setCharacters([{ name: "", realm: "", region: "", mode: "add" }]);
  };


  const handleCreateView = (e: React.FormEvent) => {
    e.preventDefault();

    const request: CreateViewRequest = {
      name: name,
      entities: characters
        .filter((c) => c.mode === "added")
        .map((c) => ({
          name: c.name,
          region: c.region,
          realm: c.realm,
          type: "com.kos.entities.domain.WowEntityRequest",
        })),
      published: true,
      featured: true,
      game: "WOW",
    };

    // await fetchWithResponse(
    //   "POST",
    //   `/views`,
    //   request,
    //   `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`,
    // );

    onCreateView({
      id: "",
      simpleView: {
        id: "",
        name: name,
        owner: "",
        published: false,
        entitiesIds: [characters.filter((c) => c.mode == "added").length],
        game: "WOW",
        featured: true,
        extraArguments: null,
      },
      isSynced: false,
    });

    onOpenChange(false);
  };

  const addCharacter = (index: number) => {
    const updated = [...characters];

    updated[index].mode = "added";

    updated.push({
      name: "",
      realm: "",
      region: "",
      mode: "add",
    });

    setCharacters(updated);
  };

  const removeCharacter = (index: number) => {
    const updated = characters.filter((_, i) => i !== index);
    setCharacters(
      updated.length
        ? updated
        : [{ name: "", realm: "", region: "", mode: "add" }],
    );
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

        <form className="dialog-form" onSubmit={handleCreateView}>
          <div className="form-content">
            <div className="form-field">
              <label className="form-label">View Name</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Main Push Team"
              />
            </div>

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

                <input
                  className="form-input"
                  placeholder="Realm"
                  value={char.realm}
                  onChange={(e) =>
                    updateCharacter(index, "realm", e.target.value)
                  }
                />

                <input
                  className="form-input"
                  placeholder="Region"
                  value={char.region}
                  onChange={(e) =>
                    updateCharacter(index, "region", e.target.value)
                  }
                />

                {char.mode === "add" ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    onClick={() => addCharacter(index)}
                    disabled={!char.name || !char.realm || !char.region}
                  >
                    Add
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline btn-small"
                    onClick={() => removeCharacter(index)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="dialog-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                !name.trim() || !characters.some((c) => c.mode == "added")
              }
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
