import { FormEvent, useState } from 'react';
import { formatDuplicateMessage, formatNotFoundMessage } from '@/features/views/utils.ts';
import { EntityRows } from '@/features/views/hooks/useEntityRows.ts';

export interface EditEntitiesOptions<E, F extends object> {
  /** The game's add-rows, from useEntityRows. */
  entityRows: EntityRows<F>;
  /** Identifies an entity across the ladder and the added rows. */
  key: (entity: E) => string;
  /** The entity an added row stands for. */
  toEntity: (fields: F) => E;
  /** How the messages name an entity, and a row as the user typed it. */
  formatEntity: (entity: E) => string;
  formatRow: (fields: F) => string;
  notFoundHint: string;
}

/**
 * The edit dialog of every game: remove members, add verified rows, and save the resulting
 * list. Saving stays with the caller (useSaveEntities); the dialog closes once it succeeds.
 */
export function useEditEntitiesForm<E, F extends object>(
  members: E[],
  onSave: (entities: E[]) => Promise<string | null>,
  onClose: () => void,
  { entityRows, key, toEntity, formatEntity, formatRow, notFoundHint }: EditEntitiesOptions<E, F>,
) {
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addedRows, notFoundRows, duplicate, hasUnfinishedRows } = entityRows;

  const remaining = members.filter((m) => !removed.has(key(m)));
  const remainingKeys = new Set(remaining.map(key));

  const added = addedRows.map(toEntity);
  const alreadyInLadder = added.find((e) => remainingKeys.has(key(e)));

  const errorMessage =
    formatDuplicateMessage(
      (duplicate && formatRow(duplicate)) ??
        (alreadyInLadder ? formatEntity(alreadyInLadder) : null),
    ) ??
    formatNotFoundMessage(notFoundRows.map(formatRow), notFoundHint) ??
    submitError;

  const canSave =
    !isSubmitting &&
    (removed.size > 0 || added.length > 0) &&
    !hasUnfinishedRows &&
    notFoundRows.length === 0 &&
    !alreadyInLadder;

  const removeMember = (member: E) => setRemoved((prev) => new Set(prev).add(key(member)));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setSubmitError(null);
    setIsSubmitting(true);
    const error = await onSave([...remaining, ...added]);
    setIsSubmitting(false);
    if (error === null) onClose();
    else setSubmitError(error);
  };

  return {
    members: remaining,
    canSave,
    errorMessage,
    isSubmitting,
    removeMember,
    handleSubmit,
  };
}
