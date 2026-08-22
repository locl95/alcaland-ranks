import { Plus, Trash2, X } from 'lucide-react';
import '@/features/views/components/shared/form-controls.css';
import './edit-view.css';
import '../character-ladder/ladder-row.css';
import { RaiderioProfile } from '@/features/views/api/raiderio.ts';
import { getClassSlug } from '@/features/views/utils.ts';
import { RealmSelect } from '@/features/views/components/shared/realm-select.tsx';
import { VerificationBadge } from '@/features/views/components/shared/verification-badge.tsx';
import { useEditViewForm } from '@/features/views/hooks/useEditViewForm.ts';

interface EditViewProps {
  characters: RaiderioProfile[];
  onClose: () => void;
  onSave: (characters: RaiderioProfile[]) => void;
}

export function EditView({ characters, onClose, onSave }: Readonly<EditViewProps>) {
  const {
    editingCharacters,
    statuses,
    newName,
    newRealm,
    newRegion,
    setName,
    setRealm,
    setRegion,
    errorMessage,
    canSave,
    addCharacter,
    deleteCharacter,
    save,
  } = useEditViewForm(characters, onSave);

  return (
    <div className="edit-view-overlay" data-testid="edit-view-overlay" onClick={onClose}>
      <div className="edit-view-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-view-header">
          <div>
            <h2 className="edit-view-title">Edit your ladder</h2>
            <p className="edit-view-subtitle">Remove or add new characters</p>
          </div>
          <button onClick={onClose} className="edit-view-close-btn" aria-label="Close">
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

                    {character.profile && (
                      <span
                        className={`character-edit-class-badge ${getClassSlug(character.profile.class)}`}
                      >
                        {character.profile.class}
                      </span>
                    )}
                  </div>

                  <div className="character-edit-meta">
                    {character.profile && (
                      <>
                        <span className="character-edit-spec">{character.profile.spec}</span>
                        <span className="character-edit-separator">•</span>
                      </>
                    )}
                    <span className="character-edit-realm">{character.realm}</span>
                    <span className="character-edit-separator">•</span>
                    <span className={`ladder-region-badge ${character.region}`}>
                      {character.region === 'us' ? 'NA' : character.region.toUpperCase()}
                    </span>
                    {character.profile?.score != null && (
                      <>
                        <span className="character-edit-separator">•</span>
                        <span className="character-edit-score">
                          {character.profile.score.toLocaleString()} M+
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {statuses[character.id] && <VerificationBadge status={statuses[character.id]} />}

                <button
                  onClick={() => deleteCharacter(character.id)}
                  className="character-delete-btn"
                  aria-label="Delete"
                >
                  <Trash2 className="delete-icon" />
                </button>
              </div>
            ))}
          </div>

          <div className="character-add-row">
            <input
              className="form-input"
              placeholder="Name"
              value={newName}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCharacter()}
            />

            <RealmSelect
              region={newRegion}
              realm={newRealm}
              onRegionChange={setRegion}
              onRealmChange={setRealm}
            />

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

          {errorMessage && <p className="form-error">{errorMessage}</p>}
        </div>

        <div className="edit-view-footer">
          <button
            onClick={save}
            className="manage-done-btn"
            disabled={!canSave}
            title={canSave ? undefined : 'Add and verify every character first'}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
