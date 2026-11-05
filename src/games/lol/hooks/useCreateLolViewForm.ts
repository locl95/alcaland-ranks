import { FormEvent, useState } from 'react';
import { View } from '@/features/views/model/view.ts';
import { userRequest } from '@/shared/api/httpClient.ts';
import { ApiError } from '@/shared/api/ApiError.ts';
import { formatDuplicateMessage } from '@/features/views/utils.ts';
import { formatNotFoundMessage, parseRiotId } from '@/games/lol/model/riot-id.ts';
import { useRiotIdRows } from '@/games/lol/hooks/useRiotIdRows.ts';

const LIMIT_ERRORS: Record<string, string> = {
  TOO_MANY_VIEWS: "You've reached the maximum number of ladders.",
  TOO_MANY_ENTITIES: 'This ladder has more players than allowed.',
};

export function useCreateLolViewForm(onClose: () => void, onCreateView: (view: View) => void) {
  const [name, setName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { rows, updateRow, verifyRow, removeRow, addedRows, notFoundRows, duplicate, isReady } =
    useRiotIdRows();

  const errorMessage =
    formatDuplicateMessage(duplicate && duplicate.riotId.trim()) ??
    formatNotFoundMessage(notFoundRows.map((r) => r.riotId.trim())) ??
    submitError;

  const addedPlayers = addedRows.flatMap((r) => parseRiotId(r.riotId) ?? []);
  const canSubmit = !isSubmitting && !!name.trim() && isReady;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const { id: operationId, resourceId } = await userRequest<{ id: string; resourceId: string }>(
        'POST',
        '/views',
        {
          name,
          entities: addedPlayers.map((p) => ({ type: 'lol', ...p })),
          published: true,
          featured: false,
          game: 'LOL',
        },
      );

      onCreateView({
        operationId,
        simpleView: {
          id: resourceId,
          name,
          owner: '',
          published: true,
          entitiesIds: addedPlayers.map((_, i) => i),
          game: 'LOL',
          featured: false,
        },
        status: 'pending',
      });

      onClose();
    } catch (err) {
      const limitError = err instanceof ApiError && err.code ? LIMIT_ERRORS[err.code] : undefined;
      setSubmitError(limitError ?? 'Failed to create ladder. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    name,
    setName,
    rows,
    canSubmit,
    errorMessage,
    isSubmitting,
    updateRow: (id: string, riotId: string) => updateRow(id, { riotId }),
    verifyRow,
    removeRow,
    handleSubmit,
  };
}
