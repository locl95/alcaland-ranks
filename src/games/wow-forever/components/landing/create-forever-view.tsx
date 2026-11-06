import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { CreateDialogProps } from '@/features/views/components/views-page/views-page.tsx';
import '@/features/views/components/shared/dialog.css';
import '@/features/views/components/shared/form-controls.css';
import { useCreateForeverViewForm } from '@/games/wow-forever/hooks/useCreateForeverViewForm.ts';
import { CharacterRow } from '@/games/wow-forever/components/shared/character-row.tsx';

export function CreateForeverView({ onClose, onCreateView }: Readonly<CreateDialogProps>) {
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
  } = useCreateForeverViewForm(onClose, onCreateView);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-panel dialog-panel--form" aria-describedby={undefined}>
          <div className="dialog-header">
            <Dialog.Title className="dialog-title">Create new leveling ladder</Dialog.Title>
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
                  placeholder="e.g., Fresh start crew"
                />
              </div>

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
