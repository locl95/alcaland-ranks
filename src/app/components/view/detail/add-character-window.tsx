import { useState, FormEvent } from "react";
import { X } from "lucide-react";
import "./add-character-window.css";

interface AddCharacterWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (characterName: string, realm: string, region: string) => void;
}

export function AddCharacterWindow({
  isOpen,
  onClose,
  onAdd,
}: AddCharacterWindowProps) {
  const [characterName, setCharacterName] = useState("");
  const [realm, setRealm] = useState("");
  const [region, setRegion] = useState("EU");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (characterName.trim() && realm.trim() && region.trim()) {
      onAdd(characterName.trim(), realm.trim(), region.trim());

      setCharacterName("");
      setRealm("");
      setRegion("EU");

      onClose();
    }
  };

  const handleClose = () => {
    // Reset form on close
    setCharacterName("");
    setRealm("");
    setRegion("EU");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="add-character-overlay" onClick={handleClose}>
      <div className="add-character-content" onClick={(e) => e.stopPropagation()}>
        <div className="add-character-header">
          <h2 className="add-character-title">Add Character</h2>
          <button onClick={handleClose} className="add-character-close-btn">
            <X className="close-icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-character-form">
          <div className="form-group">
            <label htmlFor="characterName" className="form-label">
              Character Name *
            </label>
            <input
              id="characterName"
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Enter character name"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="realm" className="form-label">
              Realm *
            </label>
            <input
              id="realm"
              type="text"
              value={realm}
              onChange={(e) => setRealm(e.target.value)}
              placeholder="e.g., Ragnaros, Tarren Mill"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="region" className="form-label">
              Region *
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="form-select"
              required
            >
              <option value="US">US</option>
              <option value="EU">EU</option>
              <option value="KR">KR</option>
              <option value="TW">TW</option>
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
              disabled={
                !characterName.trim() || !realm.trim() || !region.trim()
              }
            >
              Add Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
