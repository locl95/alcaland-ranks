import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { userRequest } from '@/shared/api/httpClient.ts';
import { ApiError } from '@/shared/api/ApiError.ts';
import { useToast } from '@/shared/components/toaster/toast.ts';
import { pollOperation, viewKeys } from '@/features/views/api/viewQueries.ts';
import { RiotId } from '@/games/lol/model/riot-id.ts';

export function useSaveLolView(viewId: string | undefined, viewName: string) {
  const queryClient = useQueryClient();
  const { showError } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const safeViewId = viewId ?? '';

  const save = async (players: RiotId[]): Promise<string | null> => {
    let operationId: string;
    try {
      ({ id: operationId } = await userRequest<{ id: string }>('PUT', `/views/${safeViewId}`, {
        name: viewName,
        entities: players.map((p) => ({ type: 'lol', ...p })),
        published: true,
        featured: false,
        game: 'LOL',
      }));
    } catch (err) {
      return err instanceof ApiError && err.code === 'TOO_MANY_ENTITIES'
        ? 'This ladder has more players than allowed.'
        : 'Failed to save changes — please try again';
    }

    setIsSaving(true);
    pollOperation(operationId)
      .then((operation) => {
        if (operation.status !== 'COMPLETED') showError('Some players could not be synced');
      })
      .catch(() => showError('Failed to save changes — please try again'))
      .finally(() => {
        setIsSaving(false);
        queryClient.invalidateQueries({ queryKey: viewKeys.data(safeViewId) });
        queryClient.invalidateQueries({ queryKey: viewKeys.detail(safeViewId) });
        queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
      });
    return null;
  };

  return { isSaving, save };
}
