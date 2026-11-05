import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X } from 'lucide-react';
import { VerificationBadge } from '@/features/views/components/shared/verification-badge.tsx';
import { CreateDialogProps } from '@/features/views/components/views-page/views-page.tsx';
import '@/features/views/components/shared/dialog.css';
import '@/features/views/components/shared/form-controls.css';
import '@/features/views/components/views-page/actions/create-view.css';
import { parseRiotId } from './riot-id.ts';
import { useCreateLolViewForm } from './useCreateLolViewForm.ts';
import './create-lol-view.css';

export function CreateLolView({ onClose, onCreateView }: Readonly<CreateDialogProps>) {
  const {
    name,
    setName,
    rows,
    canSubmit,
    errorMessage,
    isSubmitting,
    updateRow,
    verifyRow,
    removeRow,
    handleSubmit,
  } = useCreateLolViewForm(onClose, onCreateView);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-panel create-view-panel" aria-describedby={undefined}>
          <div className="dialog-header">
            <Dialog.Title className="dialog-title">Create new ranked ladder</Dialog.Title>
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
                  placeholder="e.g., Friday Flex Squad"
                />
              </div>

              {rows.map((row, index) => (
                <div key={row.id} className="player-row">
                  <input
                    className="form-input"
                    placeholder="Riot ID, e.g. Faker#KR1"
                    aria-label="Riot ID"
                    value={row.riotId}
                    onChange={(e) => updateRow(row.id, e.target.value)}
                  />

                  {row.status === 'draft' ? (
                    <button
                      type="button"
                      className="btn-icon btn-icon-primary"
                      onClick={() => verifyRow(row.id)}
                      disabled={!parseRiotId(row.riotId)}
                      title="Add"
                    >
                      <Plus size={16} />
                    </button>
                  ) : (
                    <VerificationBadge status={row.status} noun="Player" />
                  )}

                  {index < rows.length - 1 && (
                    <button
                      type="button"
                      className="btn-icon btn-icon-outline"
                      onClick={() => removeRow(row.id)}
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
                title={canSubmit ? undefined : 'Name the ladder and add at least one player'}
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
