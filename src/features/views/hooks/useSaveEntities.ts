import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { userRequest } from '@/shared/api/httpClient.ts';
import { ApiError } from '@/shared/api/ApiError.ts';
import { useToast } from '@/shared/components/toaster/toast.ts';
import { Game } from '@/features/views/api/view-types.ts';
import { fetchViewData, pollOperation, viewKeys } from '@/features/views/api/viewQueries.ts';

export type EntityStatus = 'syncing' | 'deleting';

export interface PendingEntity<E> {
  entity: E;
  status: EntityStatus;
}

export interface SaveEntitiesOptions<D, E> {
  game: Game;
  /** What the UI calls an entity, plural: "characters", "players". */
  noun: string;
  /** Turns a row of /data into the entity the ladder is edited with. */
  fromData: (row: D) => E;
  /** Identifies an entity across the ladder, the edit and /data. */
  key: (entity: E) => string;
  toRequest: (entity: E) => { type: string };
}

const SAVE_FAILED = 'Failed to save changes — please try again';

/**
 * Saves a ladder's new entity list and tracks it until the backend has synced it: added
 * entities are pending as "syncing" and removed ones as "deleting" until the operation ends
 * and the refreshed /data has arrived. Entities the operation could not add or remove end
 * up in `failed`.
 */
export function useSaveEntities<D, E>(
  viewId: string | undefined,
  viewName: string,
  data: D[],
  { game, noun, fromData, key, toRequest }: SaveEntitiesOptions<D, E>,
) {
  const queryClient = useQueryClient();
  const { showError } = useToast();
  const [pending, setPending] = useState<PendingEntity<E>[]>([]);
  const [failed, setFailed] = useState<E[]>([]);
  const safeViewId = viewId ?? '';

  const save = async (entities: E[]): Promise<string | null> => {
    const current = data.map(fromData);
    const savedKeys = new Set(entities.map(key));
    const currentKeys = new Set(current.map(key));
    const added = entities.filter((e) => !currentKeys.has(key(e)));
    const removed = current.filter((e) => !savedKeys.has(key(e)));
    if (added.length === 0 && removed.length === 0) return null;
    setFailed([]);

    let operationId: string;
    try {
      ({ id: operationId } = await userRequest<{ id: string }>('PUT', `/views/${safeViewId}`, {
        name: viewName,
        entities: entities.map(toRequest),
        published: true,
        featured: false,
        game,
      }));
    } catch (err) {
      return err instanceof ApiError && err.code === 'TOO_MANY_ENTITIES'
        ? `This ladder has more ${noun} than allowed.`
        : SAVE_FAILED;
    }

    setPending([
      ...added.map((entity) => ({ entity, status: 'syncing' as const })),
      ...removed.map((entity) => ({ entity, status: 'deleting' as const })),
    ]);

    pollOperation(operationId)
      .then(async (operation) => {
        queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
        const refetched = await fetchViewData<D>(safeViewId).catch(() => null);
        if (refetched) {
          // Swap in the refreshed ladder before dropping the pending rows, so they never blink out.
          queryClient.setQueryData(viewKeys.data(safeViewId), refetched);
          if (operation.status === 'FAILED') {
            const synced = (refetched.data ?? []).map(fromData);
            const syncedKeys = new Set(synced.map(key));
            setFailed([
              ...entities.filter((e) => !syncedKeys.has(key(e))),
              ...synced.filter((e) => !savedKeys.has(key(e))),
            ]);
          }
        } else {
          queryClient.invalidateQueries({ queryKey: viewKeys.data(safeViewId) });
        }
        setPending([]);
      })
      .catch(() => {
        setPending([]);
        queryClient.invalidateQueries({ queryKey: viewKeys.data(safeViewId) });
        showError(SAVE_FAILED);
      });
    return null;
  };

  return {
    pending,
    failed,
    isSaving: pending.length > 0,
    save,
    clearFailed: () => setFailed([]),
  };
}
