import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { RaiderioProfile } from "@/app/utils/raiderio";
import { AddCharacterWindow } from "./add-character-window";
import "./edit-view-window.css";

interface Props {
  isOpen: boolean;
  characters: RaiderioProfile[];
  onClose: () => void;
  onSave: (characters: RaiderioProfile[]) => void;
}

export function EditViewWindow({ isOpen, characters, onClose, onSave }: Props) {
  const [editingCharacters, setEditingCharacters] = useState<RaiderioProfile[]>(
    [],
  );
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditingCharacters(characters);
    }
  }, [isOpen, characters]);

  if (!isOpen) return null;

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

  return (
    <>
      <div className="edit-view-overlay" onClick={onClose}>
        <div
          className="edit-view-content"
          onClick={(e) => e.stopPropagation()}
        >
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
              {editingCharacters
                  .filter(character => character.score > -1)
                  .map((character) => (
                <div key={character.id} className="character-edit-row">
                  <div className="character-edit-info">
                    <div className="character-edit-name-row">
                      <p className="character-edit-name">{character.name}</p>
                      <span
                        className={`character-edit-class-badge ${getClassSlug(character.class)}`}
                      >
                        {character.class}
                      </span>
                    </div>
                    <div className="character-edit-meta">
                      <span className="character-edit-spec">
                        {character.spec}
                      </span>
                      <span className="character-edit-separator">•</span>
                      <span className="character-edit-realm">{"Sanguino"}</span>
                      <span className="character-edit-separator">•</span>
                      <span className="character-edit-score">
                        {character.score.toLocaleString()} M+
                      </span>
                    </div>
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

              <button
                onClick={() => setIsAddOpen(true)}
                className="character-add-btn"
              >
                <Plus className="plus-icon" />
                Add Character
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

      <AddCharacterWindow
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={addCharacter}
      />
    </>
  );
}
