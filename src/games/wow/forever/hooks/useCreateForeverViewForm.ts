import { FormEvent, useState } from 'react';
import { View } from '@/features/views/model/view.ts';
import { userRequest } from '@/shared/api/httpClient.ts';
import {
  formatDuplicateMessage,
  formatLimitError,
  formatNotFoundMessage,
} from '@/features/views/utils.ts';
import {
  formatCharacterName,
  NOT_FOUND_HINT,
  toCharacterRef,
} from '@/games/wow/forever/model/character.ts';
import { toEntityRequest } from '@/games/wow/forever/api/forever-entity-api.ts';
import { useCharacterRows } from '@/games/wow/forever/hooks/useCharacterRows.ts';

export function useCreateForeverViewForm(onClose: () => void, onCreateView: (view: View) => void) {
  const [name, setName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { rows, updateRow, verifyRow, removeRow, addedRows, notFoundRows, duplicate, isReady } =
    useCharacterRows();

  const errorMessage =
    formatDuplicateMessage(duplicate && formatCharacterName(duplicate)) ??
    formatNotFoundMessage(notFoundRows.map(formatCharacterName), NOT_FOUND_HINT) ??
    submitError;

  const addedCharacters = addedRows.map(toCharacterRef);
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
          entities: addedCharacters.map(toEntityRequest),
          published: true,
          featured: false,
          game: 'WOW_FOREVER',
        },
      );

      onCreateView({
        operationId,
        simpleView: {
          id: resourceId,
          name,
          owner: '',
          published: true,
          entitiesIds: addedCharacters.map((_, i) => i),
          game: 'WOW_FOREVER',
          featured: false,
        },
        status: 'pending',
      });

      onClose();
    } catch (err) {
      setSubmitError(
        formatLimitError(err, 'characters') ?? 'Failed to create ladder. Please try again.',
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
    updateRow,
    verifyRow,
    removeRow,
    handleSubmit,
  };
}
