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
    mode,
    selectMode,
    rows,
    canSubmit,
    errorMessage,
    isSubmitting,
    updateRow,
    verifyRow,
    removeRow,
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
              <div className="create-mode-toggle" role="group" aria-label="Ladder contents">
                <button
                  type="button"
                  className={`create-mode-btn${mode === 'characters' ? ' create-mode-btn--active' : ''}`}
                  aria-pressed={mode === 'characters'}
                  onClick={() => selectMode('characters')}
                >
                  Characters
                </button>
                <button
                  type="button"
                  className={`create-mode-btn${mode === 'guild' ? ' create-mode-btn--active' : ''}`}
                  aria-pressed={mode === 'guild'}
                  onClick={() => selectMode('guild')}
                >
                  Guild
                </button>
              </div>

              {rows.map((row, index) => (
                <div key={row.id} className="entity-row">
                  <input
                    className="form-input"
                    placeholder={mode === 'guild' ? 'Guild name' : 'Name'}
                    value={row.name}
                    onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                  />

                  <RealmSelect
                    region={row.region}
                    realm={row.realm}
                    onRegionChange={(v) => updateRow(row.id, 'region', v)}
                    onRealmChange={(v) => updateRow(row.id, 'realm', v)}
                  />

                  {row.status === 'draft' ? (
                    <button
                      type="button"
                      className="btn-icon btn-icon-primary"
                      onClick={() => verifyRow(row.id)}
                      disabled={!row.name || !row.realm}
                      title="Add"
                    >
                      <Plus size={16} />
                    </button>
                  ) : (
                    <VerificationBadge status={row.status} />
                  )}

                  {/* Never renders in guild mode: the single row is always the last one. */}
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

              {mode === 'guild' && (
                <p className="form-hint">The whole roster is pulled in for you.</p>
              )}

              {errorMessage && <p className="form-error">{errorMessage}</p>}
            </div>

            <div className="dialog-footer">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!canSubmit}
                title={
                  canSubmit
                    ? undefined
                    : mode === 'guild'
                      ? 'Name the ladder and add a guild'
                      : 'Name the ladder and add at least one character'
                }
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
