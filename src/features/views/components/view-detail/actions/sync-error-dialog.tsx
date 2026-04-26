import { AlertTriangle, X } from "lucide-react";
import { RaiderioProfile } from "@/features/views/api/raiderio.ts";
import "./sync-error-dialog.css";

interface SyncErrorDialogProps {
  failedCharacters: RaiderioProfile[];
  onClose: () => void;
}

export function SyncErrorDialog({ failedCharacters, onClose }: Readonly<SyncErrorDialogProps>) {
  if (failedCharacters.length === 0) return null;

  return (
    <div className="sync-error-overlay" onClick={onClose}>
      <div className="sync-error-content" onClick={(e) => e.stopPropagation()}>
        <div className="sync-error-header">
          <div className="sync-error-title-row">
            <AlertTriangle className="sync-error-icon" />
            <h2 className="sync-error-title">Some characters couldn't be synced</h2>
          </div>
          <button onClick={onClose} className="sync-error-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="sync-error-body">
          <p className="sync-error-description">
            The following characters were not found or couldn't be processed by the backend.
            Please check that the name, realm, and region are correct and that the character exists.
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
          <button onClick={onClose} className="sync-error-dismiss-btn">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
