import { useState, FormEvent } from "react";
import { X } from "lucide-react";
import { EU_REALMS } from "@/features/views/constants/euRealms.ts";
import "./add-character.css";

interface AddCharacterWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (characterName: string, realm: string) => void;
}

export function AddCharacter({
  isOpen,
  onClose,
  onAdd,
}: Readonly<AddCharacterWindowProps>) {
  const [characterName, setCharacterName] = useState("");
  const [realm, setRealm] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (characterName.trim() && realm) {
      onAdd(characterName.trim(), realm);
      setCharacterName("");
      setRealm("");
      onClose();
    }
  };

  const handleClose = () => {
    setCharacterName("");
    setRealm("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="add-character-overlay" onClick={handleClose}>
      <div
        className="add-character-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="add-character-header">
          <h2 className="add-character-title">Add Character</h2>
          <button onClick={handleClose} className="add-character-close-btn">
            <X className="close-icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-character-form">
          <div className="add-character-row">
            <input
              id="characterName"
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Character name"
              className="form-input"
              required
            />

            <select
              id="realm"
              value={realm}
              onChange={(e) => setRealm(e.target.value)}
              className="form-select"
              required
            >
              <option value="">Realm</option>
              {EU_REALMS.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="add-character-actions">
            <button
              type="button"
              onClick={handleClose}
              className="add-character-btn add-character-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-character-btn add-character-btn-submit"
              disabled={!characterName.trim() || !realm}
            >
              Add Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
