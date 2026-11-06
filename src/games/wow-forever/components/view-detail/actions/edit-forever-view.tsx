import * as Dialog from '@radix-ui/react-dialog';
import { Trash2, X } from 'lucide-react';
import '@/features/views/components/shared/dialog.css';
import '@/features/views/components/shared/form-controls.css';
import {
  CharacterRef,
  characterKey,
  formatCharacterName,
} from '@/games/wow-forever/model/character.ts';
import { useEditForeverViewForm } from '@/games/wow-forever/hooks/useEditForeverViewForm.ts';
import { CharacterRow } from '@/games/wow-forever/components/shared/character-row.tsx';
import { regionLabel } from '@/games/wow-forever/constants/regions.ts';
import './edit-forever-view.css';

interface EditForeverViewProps {
  characters: CharacterRef[];
  onClose: () => void;
  onSave: (characters: CharacterRef[]) => Promise<string | null>;
}

export function EditForeverView({ characters, onClose, onSave }: Readonly<EditForeverViewProps>) {
  const {
    members,
    rows,
    canSave,
    errorMessage,
    isSubmitting,
    removeMember,
    updateRow,
    verifyRow,
    removeRow,
    handleSubmit,
  } = useEditForeverViewForm(characters, onSave, onClose);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-panel dialog-panel--form" aria-describedby={undefined}>
          <div className="dialog-header">
            <Dialog.Title className="dialog-title">Edit your ladder</Dialog.Title>
            <Dialog.Close className="dialog-close-btn" aria-label="Close">
              <X size={20} />
            </Dialog.Close>
          </div>

          <form className="dialog-form" onSubmit={handleSubmit}>
            <div className="form-content">
              <div className="form-field">
                <span className="form-label">Characters</span>
                <ul className="edit-forever-members" aria-label="Characters">
                  {members.map((member) => {
                    const name = formatCharacterName(member);
                    return (
                      <li key={characterKey(member)} className="edit-forever-member">
                        <span className="edit-forever-member-name">{name}</span>
                        <span className="edit-forever-member-region">
                          {regionLabel(member.region)}
                        </span>
                        <button
                          type="button"
                          className="btn-icon btn-icon-outline"
                          onClick={() => removeMember(member)}
                          aria-label={`Remove ${name}`}
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="form-field">
                <label className="form-label">Add characters</label>
                {rows.map((row, index) => (
                  <CharacterRow
                    key={row.id}
                    character={row}
                    status={row.status}
                    canRemove={index < rows.length - 1}
                    onChange={(changes) => updateRow(row.id, changes)}
                    onVerify={() => verifyRow(row.id)}
                    onRemove={() => removeRow(row.id)}
                  />
                ))}
              </div>

              {errorMessage && <p className="form-error">{errorMessage}</p>}
            </div>

            <div className="dialog-footer">
              <button type="submit" className="btn btn-primary" disabled={!canSave}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
