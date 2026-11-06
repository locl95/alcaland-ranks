import { FormEvent, useState } from 'react';
import { View } from '@/features/views/model/view.ts';
import { userRequest } from '@/shared/api/httpClient.ts';
import {
  formatDuplicateMessage,
  formatLimitError,
  formatNotFoundMessage,
} from '@/features/views/utils.ts';
import { NOT_FOUND_HINT, parseRiotId } from '@/games/lol/model/riot-id.ts';
import { useRiotIdRows } from '@/games/lol/hooks/useRiotIdRows.ts';

export function useCreateLolViewForm(onClose: () => void, onCreateView: (view: View) => void) {
  const [name, setName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { rows, updateRow, verifyRow, removeRow, addedRows, notFoundRows, duplicate, isReady } =
    useRiotIdRows();

  const errorMessage =
    formatDuplicateMessage(duplicate && duplicate.riotId.trim()) ??
    formatNotFoundMessage(
      notFoundRows.map((r) => r.riotId.trim()),
      NOT_FOUND_HINT,
    ) ??
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
      setSubmitError(
        formatLimitError(err, 'players') ?? 'Failed to create ladder. Please try again.',
      );
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
