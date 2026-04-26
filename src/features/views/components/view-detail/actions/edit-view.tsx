import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import "./edit-view.css";
import { RaiderioProfile } from "@/features/views/api/raiderio.ts";
import { getClassSlug } from "@/features/views/utils.ts";
import { EU_REALMS } from "@/features/views/constants/euRealms.ts";
import { NA_REALMS } from "@/features/views/constants/naRealms.ts";

interface EditViewProps {
  isOpen: boolean;
  characters: RaiderioProfile[];
  onClose: () => void;
  onSave: (characters: RaiderioProfile[]) => void;
}

export function EditView({
  isOpen,
  characters,
  onClose,
  onSave,
}: Readonly<EditViewProps>) {
  const [editingCharacters, setEditingCharacters] = useState<RaiderioProfile[]>([]);
  const [newName, setNewName] = useState("");
  const [newRealm, setNewRealm] = useState("");
  const [newRegion, setNewRegion] = useState("eu");

  useEffect(() => {
    if (isOpen) {
      setEditingCharacters(characters.filter((c) => c.score > -1));
      setNewName("");
      setNewRealm("");
      setNewRegion("eu");
    }
  }, [isOpen, characters]);

  const deleteCharacter = (id: number) => {
    setEditingCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const addCharacter = () => {
    if (!newName.trim() || !newRealm) return;

    const newCharacter: RaiderioProfile = {
      id: Date.now(),
      name: newName.trim(),
      realm: newRealm,
      region: newRegion,
      score: -1,
      class: "",
      spec: "",
      quantile: 0,
      mythicPlusBestRuns: [],
      mythicPlusRanks: {
        overall: { world: 0, region: 0, realm: 0 },
        class: { world: 0, region: 0, realm: 0 },
        specs: [],
      },
      mythicPlusRecentRuns: []
    };

    setEditingCharacters((prev) => [...prev, newCharacter]);
    setNewName("");
    setNewRealm("");
    setNewRegion("eu");
  };

  if (!isOpen) return null;

  return (
    <div className="edit-view-overlay" onClick={onClose}>
      <div className="edit-view-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-view-header">
          <div>
            <h2 className="edit-view-title">Edit your ladder</h2>
            <p className="edit-view-subtitle">
              Remove or add new characters
            </p>
          </div>
          <button onClick={onClose} className="edit-view-close-btn">
            <X className="close-icon" />
          </button>
        </div>

        <div className="edit-view-body">
          <div className="character-edit-items">
            {editingCharacters.map((character) => (
              <div key={character.id} className="character-edit-row">
                <div className="character-edit-info">
                  <div className="character-edit-name-row">
                    <p className="character-edit-name">{character.name}</p>

                    {character.score > -1 && (
                      <span
                        className={`character-edit-class-badge ${getClassSlug(character.class)}`}
                      >
                        {character.class}
                      </span>
                    )}
                  </div>

                  {character.score > -1 && (
                    <div className="character-edit-meta">
                      <span className="character-edit-spec">{character.spec}</span>
                      <span className="character-edit-separator">•</span>
                      <span className="character-edit-realm">{character.realm}</span>
                      <span className="character-edit-separator">•</span>
                      <span className="character-edit-score">
                        {character.score.toLocaleString()} M+
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => deleteCharacter(character.id)}
                  className="character-delete-btn"
                >
                  <Trash2 className="delete-icon" />
                  Delete
                </button>
              </div>
            ))}
          </div>

          <div className="character-add-row">
            <input
              className="form-input"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCharacter()}
            />

            <select
              className="form-select form-select-region"
              value={newRegion}
              onChange={(e) => {
                setNewRegion(e.target.value);
                setNewRealm("");
              }}
            >
              <option value="eu">EU</option>
              <option value="us">NA</option>
            </select>

            <select
              className="form-select"
              value={newRealm}
              onChange={(e) => setNewRealm(e.target.value)}
            >
              <option value="">Realm</option>
              {(newRegion === "us" ? NA_REALMS : EU_REALMS).map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn-icon btn-icon-primary"
              onClick={addCharacter}
              disabled={!newName.trim() || !newRealm}
              title="Add"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="edit-view-footer">
          <button
            onClick={() => onSave(editingCharacters)}
            className="manage-done-btn"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
