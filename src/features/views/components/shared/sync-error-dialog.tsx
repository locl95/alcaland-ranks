import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import './dialog.css';
import './sync-error-dialog.css';

export interface SyncErrorItem {
  key: string;
  name: string;
  meta?: string;
}

interface SyncErrorDialogProps {
  title: string;
  description: string;
  items: SyncErrorItem[];
  onClose: () => void;
}

export function SyncErrorDialog({
  title,
  description,
  items,
  onClose,
}: Readonly<SyncErrorDialogProps>) {
  if (items.length === 0) return null;

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
              <Dialog.Title className="sync-error-title">{title}</Dialog.Title>
            </div>
            <Dialog.Close className="dialog-close-btn" aria-label="Close">
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="sync-error-body">
            <p className="sync-error-description">{description}</p>

            <ul className="sync-error-list">
              {items.map((item) => (
                <li key={item.key} className="sync-error-item-row">
                  <span className="sync-error-item-name">{item.name}</span>
                  {item.meta && <span className="sync-error-item-meta">{item.meta}</span>}
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
