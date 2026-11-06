import { FormEvent, useState } from 'react';
import { View } from '@/features/views/model/view.ts';
import { userRequest } from '@/shared/api/httpClient.ts';
import { ApiError } from '@/shared/api/ApiError.ts';
import { ViewExtraArguments } from '@/features/views/api/view-types.ts';
import { entityKey, verifyEntity, verifyGuild } from '@/games/wow/api/wow-entity-api.ts';
import { useEntityRows } from '@/features/views/hooks/useEntityRows.ts';
import { formatDuplicateMessage, formatNotFoundMessage } from '@/features/views/utils.ts';
import { NOT_FOUND_HINT } from '@/games/wow/utils.ts';

export type CreateMode = 'characters' | 'guild';

interface CharacterFields {
  name: string;
  realm: string;
  region: string;
}

const GUILD_EXTRA_ARGUMENTS: ViewExtraArguments = { type: 'wow', isGuild: true };

const LIMIT_ERRORS: Record<string, string> = {
  TOO_MANY_VIEWS: "You've reached the maximum number of ladders.",
  TOO_MANY_ENTITIES: 'This ladder has more characters than allowed.',
};

const toEntity = (fields: CharacterFields) => ({
  name: fields.name.trim(),
  region: fields.region,
  realm: fields.realm,
});

export function useCreateViewForm(onClose: () => void, onCreateView: (view: View) => void) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<CreateMode>('characters');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  } = useEntityRows<CharacterFields>({
    emptyFields: () => ({ name: '', realm: '', region: 'eu' }),
    keyOf: (fields) => (fields.name.trim() && fields.realm ? entityKey(toEntity(fields)) : null),
    isBlank: (fields) => !fields.name.trim(),
    verify: (fields) =>
      mode === 'guild' ? verifyGuild(toEntity(fields)) : verifyEntity(toEntity(fields)),
    growsOnVerify: mode === 'characters',
  });

  const selectMode = (next: CreateMode) => {
    if (next === mode) return;
    setMode(next);
    reset();
    setSubmitError(null);
  };

  const errorMessage =
    formatDuplicateMessage(duplicate && duplicate.name.trim()) ??
    formatNotFoundMessage(
      notFoundRows.map((r) => r.name.trim()),
      NOT_FOUND_HINT,
    ) ??
    submitError;

  const ladderName = mode === 'guild' ? (addedRows[0]?.name.trim() ?? '') : name;
  const canSubmit = !isSubmitting && !!ladderName.trim() && isReady;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitError(null);
    setIsSubmitting(true);

    const extraArguments = mode === 'guild' ? GUILD_EXTRA_ARGUMENTS : null;

    try {
      const { id: operationId, resourceId } = await userRequest<{ id: string; resourceId: string }>(
        'POST',
        '/views',
        {
          name: ladderName,
          entities: addedRows.map((r) => ({
            name: r.name.trim(),
            region: r.region,
            realm: r.realm,
            type: 'wow',
          })),
          published: true,
          featured: false,
          game: 'WOW',
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
          entitiesIds: addedRows.map((_, i) => i),
          game: 'WOW',
          featured: false,
          extraArguments,
        },
        status: 'pending',
      });

      onClose();
    } catch (err) {
      const limitError = err instanceof ApiError && err.code ? LIMIT_ERRORS[err.code] : undefined;
      setSubmitError(
        limitError ??
          (mode === 'guild'
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
    updateRow: (id: string, field: keyof CharacterFields, value: string) =>
      updateRow(id, { [field]: value }),
    verifyRow,
    removeRow,
    handleSubmit,
  };
}
