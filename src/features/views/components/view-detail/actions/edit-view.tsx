import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { AddCharacter } from "./add-character.tsx";
import "./edit-view.css";
import { RaiderioProfile } from "@/features/views/api/raiderio.ts";

interface Props {
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
}: Readonly<Props>) {
  const [editingCharacters, setEditingCharacters] = useState<RaiderioProfile[]>(
    [],
  );
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditingCharacters(
        characters.filter((character) => character.score > -1),
      );
    }
  }, [isOpen, characters]);

  const deleteCharacter = (id: number) => {
    setEditingCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const getClassSlug = (className: string): string => {
    return className.toLowerCase().replace(/\s+/g, "-");
  };

  const addCharacter = (name: string, realm: string, region: string) => {
    const newCharacter: RaiderioProfile = {
      id: Date.now(),
      name,
      realm,
      region,
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
    };

    setEditingCharacters((prev) => [...prev, newCharacter]);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="edit-view-overlay" onClick={onClose}>
        <div className="edit-view-content" onClick={(e) => e.stopPropagation()}>
          <div className="edit-view-header">
            <div>
              <h2 className="edit-view-title">Manage Characters</h2>
              <p className="edit-view-subtitle">
                Edit your character list by adding or removing characters
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
                          className={`character-edit-class-badge ${getClassSlug(
                            character.class,
                          )}`}
                        >
                          {character.class}
                        </span>
                      )}
                    </div>

                    {character.score > -1 && (
                      <div className="character-edit-meta">
                        <span className="character-edit-spec">
                          {character.spec}
                        </span>
                        <span className="character-edit-separator">•</span>
                        <span className="character-edit-realm">
                          {character.realm}
                        </span>
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
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="character-add-btn"
          >
            <Plus className="plus-icon" />
            Add Character
          </button>

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

      <AddCharacter
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={addCharacter}
      />
    </>
  );
}
