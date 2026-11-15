import { FormEvent, useState } from 'react';
import { View } from '@/features/views/model/view.ts';
import { userRequest } from '@/shared/api/httpClient.ts';
import { ViewExtraArguments } from '@/features/views/api/view-types.ts';
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
import { toEntityRequest, toGuildRequest } from '@/games/wow/forever/api/forever-entity-api.ts';
import { useCharacterRows } from '@/games/wow/forever/hooks/useCharacterRows.ts';
import { CreateMode } from '@/games/wow/components/create-mode-toggle.tsx';

const GUILD_EXTRA_ARGUMENTS: ViewExtraArguments = { type: 'wow', isGuild: true };
const GUILD_NOT_FOUND_HINT = 'Check the name and region.';

export function useCreateForeverViewForm(onClose: () => void, onCreateView: (view: View) => void) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<CreateMode>('characters');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isGuild = mode === 'guild';
  const {
    rows,
    updateRow,
    verifyRow,
    removeRow,
    reset,
    addedRows,
    notFoundRows,
    duplicate,
    isReady,
  } = useCharacterRows(isGuild);

  const selectMode = (next: CreateMode) => {
    if (next === mode) return;
    setMode(next);
    reset();
    setSubmitError(null);
  };

  const formatRow = isGuild ? (row: { name: string }) => row.name.trim() : formatCharacterName;
  const errorMessage =
    formatDuplicateMessage(duplicate && formatRow(duplicate)) ??
    formatNotFoundMessage(
      notFoundRows.map(formatRow),
      isGuild ? GUILD_NOT_FOUND_HINT : NOT_FOUND_HINT,
    ) ??
    submitError;

  const addedCharacters = addedRows.map(toCharacterRef);
  const ladderName = isGuild ? (addedCharacters[0]?.name.trim() ?? '') : name;
  const canSubmit = !isSubmitting && !!ladderName.trim() && isReady;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitError(null);
    setIsSubmitting(true);

    const extraArguments = isGuild ? GUILD_EXTRA_ARGUMENTS : null;

    try {
      const { id: operationId, resourceId } = await userRequest<{ id: string; resourceId: string }>(
        'POST',
        '/views',
        {
          name: ladderName,
          entities: addedCharacters.map(isGuild ? toGuildRequest : toEntityRequest),
          published: true,
          featured: false,
          game: 'WOW_FOREVER',
          ...(extraArguments && { extraArguments }),
        },
      );

      onCreateView({
        operationId,
        simpleView: {
          id: resourceId,
          name: ladderName,
          owner: '',
          published: true,
          entitiesIds: addedCharacters.map((_, i) => i),
          game: 'WOW_FOREVER',
          featured: false,
          extraArguments,
        },
        status: 'pending',
      });

      onClose();
    } catch (err) {
      setSubmitError(
        formatLimitError(err, 'characters') ??
          (isGuild
            ? 'Failed to create guild ladder. Please try again.'
            : 'Failed to create ladder. Please try again.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
}
