import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X } from 'lucide-react';
import { VerificationBadge } from '@/features/views/components/shared/verification-badge.tsx';
import { hasOpenPopupInside } from '@/features/views/components/shared/dialog.ts';
import '@/features/views/components/shared/dialog.css';
import '@/features/views/components/shared/form-controls.css';
import './create-view.css';
import { View } from '@/features/views/model/view.ts';
import { RealmSelect } from '@/features/views/components/shared/realm-select.tsx';
import { useCreateViewForm } from '@/features/views/hooks/useCreateViewForm.ts';

interface CreateViewDialogProps {
  onClose: () => void;
  onCreateView: (newView: View) => void;
}

export function CreateView({ onClose, onCreateView }: Readonly<CreateViewDialogProps>) {
  const {
    name,
    setName,
    characters,
    canSubmit,
    errorMessage,
    isSubmitting,
    updateCharacter,
    addCharacter,
    removeCharacter,
    handleSubmit,
  } = useCreateViewForm(onClose, onCreateView);

  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          ref={panelRef}
          className="dialog-panel create-view-panel"
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => {
            if (hasOpenPopupInside(panelRef.current)) e.preventDefault();
          }}
        >
          <div className="dialog-header">
            <Dialog.Title className="dialog-title">Create new m+ ladder</Dialog.Title>
            <Dialog.Close className="dialog-close-btn" aria-label="Close">
              <X size={20} />
            </Dialog.Close>
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
                <div key={char.id} className="character-row">
                  <input
                    className="form-input"
                    placeholder="Name"
                    value={char.name}
                    onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                  />

                  <RealmSelect
                    region={char.region}
                    realm={char.realm}
                    onRegionChange={(v) => updateCharacter(char.id, 'region', v)}
                    onRealmChange={(v) => updateCharacter(char.id, 'realm', v)}
                  />

                  {char.status === 'draft' && (
                    <button
                      type="button"
                      className="btn-icon btn-icon-primary"
                      onClick={() => addCharacter(char.id)}
                      disabled={!char.name || !char.realm}
                      title="Add"
                    >
                      <Plus size={16} />
                    </button>
                  )}

                  {char.status !== 'draft' && <VerificationBadge status={char.status} />}

                  {index < characters.length - 1 && (
                    <button
                      type="button"
                      className="btn-icon btn-icon-outline"
                      onClick={() => removeCharacter(char.id)}
                      title="Remove"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}

              {errorMessage && <p className="form-error">{errorMessage}</p>}
            </div>

            <div className="dialog-footer">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!canSubmit}
                title={canSubmit ? undefined : 'Name the ladder and add at least one character'}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
