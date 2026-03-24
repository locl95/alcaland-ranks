import { useCallback, useEffect, useState } from "react";
import "./create-view.css";
import { fetchWithResponse } from "@/app/utils/EasyFetch.ts";
import { View } from "@/app/utils/views/View.tsx";

interface CharacterRow {
  name: string;
  realm: string;
  region: string;
  mode: "add" | "added";
}

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
  const [name, setName] = useState("");

  const [characters, setCharacters] = useState<CharacterRow[]>([
    { name: "", realm: "", region: "", mode: "add" },
  ]);

  const resetForm = useCallback(() => {
    setName("");
    setCharacters([{ name: "", realm: "", region: "", mode: "add" }]);
  }, []);

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

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const updateCharacter = useCallback(
    (index: number, field: string, value: string) => {
      setCharacters((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    [],
  );

  const addCharacter = useCallback((index: number) => {
    setCharacters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], mode: "added" };

      updated.push({
        name: "",
        realm: "",
        region: "",
        mode: "add",
      });

      return updated;
    });
  }, []);

  const removeCharacter = useCallback((index: number) => {
    setCharacters((prev) => {
      const updated = prev.filter((_, i) => i !== index);

      return updated.length
        ? updated
        : [{ name: "", realm: "", region: "", mode: "add" }];
    });
  }, []);

  const getAddedCharacters = useCallback(() => {
    return characters
      .map((c, i, arr) => {
        if (
          i === arr.length - 1 &&
          c.mode === "add" &&
          c.name.trim() &&
          c.realm.trim() &&
          c.region.trim()
        ) {
          return { ...c, mode: "added" };
        }
        return c;
      })
      .filter((c) => c.mode === "added");
  }, [characters]);

  const canSubmit = useCallback(() => {
    return name.trim() && characters.some((c) => c.mode === "added");
  }, [name, characters]);

  const handleCreateView = async (e: React.FormEvent) => {
    e.preventDefault();

    const addedCharacters = getAddedCharacters();

    const request = {
      name,
      entities: addedCharacters.map((c) => ({
        name: c.name,
        region: c.region,
        realm: c.realm,
        type: "com.kos.entities.domain.WowEntityRequest",
      })),
      published: true,
      featured: false,
      game: "WOW",
    };

    try {
      await fetchWithResponse(
        "POST",
        `/views`,
        request,
        `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`,
      );

      onCreateView({
        id: "",
        simpleView: {
          id: "",
          name,
          owner: "",
          published: false,
          entitiesIds: [],
          game: "WOW",
          featured: false,
          extraArguments: null,
        },
        isSynced: false,
      });
    } catch (error) {
      console.error("Failed to create view", error);
    } finally {
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
              disabled={!canSubmit()}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
