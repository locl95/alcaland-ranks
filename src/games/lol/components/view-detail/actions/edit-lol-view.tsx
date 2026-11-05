import * as Dialog from '@radix-ui/react-dialog';
import { Trash2, X } from 'lucide-react';
import '@/features/views/components/shared/dialog.css';
import '@/features/views/components/shared/form-controls.css';
import { RiotId } from '@/games/lol/model/riot-id.ts';
import { useEditLolViewForm } from '@/games/lol/hooks/useEditLolViewForm.ts';
import { RiotIdRow } from '@/games/lol/components/shared/riot-id-row.tsx';
import './edit-lol-view.css';

interface EditLolViewProps {
  viewId: string;
  onClose: () => void;
  onSave: (players: RiotId[]) => Promise<string | null>;
}

export function EditLolView({ viewId, onClose, onSave }: Readonly<EditLolViewProps>) {
  const {
    members,
    loadFailed,
    rows,
    canSave,
    errorMessage,
    isSubmitting,
    removeMember,
    updateRow,
    verifyRow,
    removeRow,
    handleSubmit,
  } = useEditLolViewForm(viewId, onSave, onClose);

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
                <span className="form-label">Players</span>
                {members === null ? (
                  <p className="edit-lol-status">
                    {loadFailed ? "Couldn't load the players of this ladder." : 'Loading players…'}
                  </p>
                ) : (
                  <ul className="edit-lol-members" aria-label="Players">
                    {members.map((member) => {
                      const riotId = `${member.name}#${member.tag}`;
                      return (
                        <li key={riotId} className="edit-lol-member">
                          <span className="edit-lol-member-id">{riotId}</span>
                          <button
                            type="button"
                            className="btn-icon btn-icon-outline"
                            onClick={() => removeMember(member)}
                            aria-label={`Remove ${riotId}`}
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">Add players</label>
                {rows.map((row, index) => (
                  <RiotIdRow
                    key={row.id}
                    riotId={row.riotId}
                    status={row.status}
                    canRemove={index < rows.length - 1}
                    onChange={(riotId) => updateRow(row.id, riotId)}
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
