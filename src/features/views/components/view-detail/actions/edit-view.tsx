import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Trash2, X } from 'lucide-react';
import { hasOpenPopupInside } from '@/features/views/components/shared/dialog.ts';
import '@/features/views/components/shared/dialog.css';
import '@/features/views/components/shared/form-controls.css';
import './edit-view.css';
import '../character-ladder/ladder-row.css';
import { RaiderioProfile } from '@/features/views/api/raiderio.ts';
import { getClassSlug, getScoreClass } from '@/features/views/utils.ts';
import { CLASS_COLORS } from '@/features/views/constants/class-colors.ts';
import { RealmSelect } from '@/features/views/components/shared/realm-select.tsx';
import { VerificationBadge } from '@/features/views/components/shared/verification-badge.tsx';
import { useEditViewForm } from '@/features/views/hooks/useEditViewForm.ts';

const DARK_CLASSES = new Set(['death-knight', 'warlock', 'demon-hunter']);

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

  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" data-testid="edit-view-overlay" />
        <Dialog.Content
          ref={panelRef}
          className="dialog-panel edit-view-panel"
          onEscapeKeyDown={(e) => {
            if (hasOpenPopupInside(panelRef.current)) e.preventDefault();
          }}
        >
          <div className="edit-view-header">
            <div>
              <Dialog.Title className="edit-view-title">Edit your ladder</Dialog.Title>
              <Dialog.Description className="edit-view-subtitle">
                Remove or add new characters
              </Dialog.Description>
            </div>
            <Dialog.Close className="dialog-close-btn" aria-label="Close">
              <X className="close-icon" />
            </Dialog.Close>
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
                          className={`character-edit-class-badge${
                            DARK_CLASSES.has(getClassSlug(character.profile.class))
                              ? ' character-edit-class-badge--on-dark'
                              : ''
                          }`}
                          style={{
                            background: CLASS_COLORS[getClassSlug(character.profile.class)],
                          }}
                        >
                          {character.profile.class}
                        </span>
                      )}
                    </div>

                    <div className="character-edit-meta">
                      <span className="character-edit-spec">{character.profile?.spec}</span>
                      <span className="character-edit-realm">{character.realm}</span>
                      <span className="character-edit-region">
                        <span className={`ladder-region-badge ${character.region}`}>
                          {character.region === 'us' ? 'NA' : character.region.toUpperCase()}
                        </span>
                      </span>
                      <span className="character-edit-score">
                        {character.profile?.score != null && (
                          <span className={`num ${getScoreClass(character.profile.score)}`}>
                            {character.profile.score.toLocaleString()}
                          </span>
                        )}
                      </span>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
