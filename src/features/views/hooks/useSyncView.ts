import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createSyncTask, pollSyncTask } from '@/features/views/api/taskApi';
import { viewKeys } from '@/features/views/api/viewQueries.ts';

function formatCountdown(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${seconds}s`;
}

const storageKey = (viewId: string, key: 'cooldown' | 'lastSyncedAt') =>
  `alcaland:${key}:${viewId}`;

function readStoredCooldown(viewId: string | undefined): Date | null {
  if (!viewId) return null;
  const stored = localStorage.getItem(storageKey(viewId, 'cooldown'));
  if (!stored) return null;
  const date = new Date(stored);
  return date > new Date() ? date : null;
}

export interface SyncViewResult {
  isRunning: boolean;
  isDisabled: boolean;
  countdownLabel: string | null;
  statusMessage: string | null;
  lastSyncedAt: string | null;
  triggerSync: () => void;
}

export function useSyncView(viewId: string | undefined): SyncViewResult {
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [retryAfter, setRetryAfter] = useState<Date | null>(() => readStoredCooldown(viewId));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    viewId ? localStorage.getItem(storageKey(viewId, 'lastSyncedAt')) : null,
  );

  // Abort any in-flight poll on unmount
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  // Re-render every second while cooldown is active so secondsLeft stays current
  const setTick = useState(0)[1];
  useEffect(() => {
    if (!retryAfter) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  // Derived — no separate state needed
  const secondsLeft =
    retryAfter === null ? null : Math.max(0, Math.ceil((retryAfter.getTime() - Date.now()) / 1000));

  // Expire cooldown when countdown reaches zero
  useEffect(() => {
    if (secondsLeft !== 0) return;
    setRetryAfter(null);
    setStatusMessage(null);
    if (viewId) localStorage.removeItem(storageKey(viewId, 'cooldown'));
  }, [secondsLeft, viewId]);

  const triggerSync = async () => {
    if (!viewId || isRunning || secondsLeft !== null) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setIsRunning(true);
    setStatusMessage(null);

    try {
      const { id: taskId } = await createSyncTask(viewId);
      const task = await pollSyncTask(taskId, controller.signal);
      const { status, message, retryAfter: retryAfterStr } = task.taskStatus;

      if (status === 'SUCCESSFUL') {
        const syncedAt = new Date().toISOString();
        setLastSyncedAt(syncedAt);
        localStorage.setItem(storageKey(viewId, 'lastSyncedAt'), syncedAt);
        queryClient.invalidateQueries({ queryKey: viewKeys.data(viewId) });

        if (retryAfterStr) {
          const date = new Date(retryAfterStr);
          setRetryAfter(date);
          localStorage.setItem(storageKey(viewId, 'cooldown'), date.toISOString());
        } else {
          setStatusMessage('Synced successfully');
        }
      } else if (retryAfterStr) {
        const date = new Date(retryAfterStr);
        setRetryAfter(date);
        localStorage.setItem(storageKey(viewId, 'cooldown'), date.toISOString());
        setStatusMessage('Synced too recently');
      } else {
        setStatusMessage(message || 'Sync failed');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setStatusMessage('Sync failed — please try again');
    } finally {
      if (!controller.signal.aborted) setIsRunning(false);
    }
  };

  return {
    isRunning,
    isDisabled: isRunning || secondsLeft !== null,
    countdownLabel: secondsLeft === null ? null : formatCountdown(secondsLeft),
    statusMessage,
    lastSyncedAt,
    triggerSync,
  };
}
