import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import { RaiderioProfile } from '@/features/views/api/raiderio.ts';
import '@/features/views/components/shared/dialog.css';
import './sync-error-dialog.css';

interface SyncErrorDialogProps {
  failedCharacters: RaiderioProfile[];
  onClose: () => void;
}

export function SyncErrorDialog({ failedCharacters, onClose }: Readonly<SyncErrorDialogProps>) {
  if (failedCharacters.length === 0) return null;

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" data-testid="sync-error-overlay" />
        <Dialog.Content
          className="dialog-panel sync-error-panel"
          data-testid="sync-error-content"
          aria-describedby={undefined}
        >
          <div className="sync-error-header">
            <div className="sync-error-title-row">
              <AlertTriangle className="sync-error-icon" />
              <Dialog.Title className="sync-error-title">
                Some characters couldn&apos;t be synced
              </Dialog.Title>
            </div>
            <Dialog.Close className="dialog-close-btn" aria-label="Close">
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="sync-error-body">
            <p className="sync-error-description">
              The following characters were not found or couldn&apos;t be processed. Please check
              that the name, realm, and region are correct.
            </p>

            <ul className="sync-error-list">
              {failedCharacters.map((c) => (
                <li key={`${c.region}-${c.realm}-${c.name}`} className="sync-error-char-row">
                  <span className="sync-error-char-name">{c.name}</span>
                  <span className="sync-error-char-meta">
                    {c.region.toUpperCase()} · {c.realm}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="sync-error-footer">
            <Dialog.Close className="sync-error-dismiss-btn">Got it</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
