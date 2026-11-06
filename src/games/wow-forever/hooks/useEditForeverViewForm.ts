import { FormEvent, useState } from 'react';
import { formatDuplicateMessage, formatNotFoundMessage } from '@/features/views/utils.ts';
import {
  CharacterRef,
  characterKey,
  formatCharacterName,
  NOT_FOUND_HINT,
} from '@/games/wow-forever/model/character.ts';
import { useCharacterRows } from '@/games/wow-forever/hooks/useCharacterRows.ts';

export function useEditForeverViewForm(
  members: CharacterRef[],
  onSave: (characters: CharacterRef[]) => Promise<string | null>,
  onClose: () => void,
) {
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { rows, updateRow, verifyRow, removeRow, addedRows, notFoundRows, duplicate } =
    useCharacterRows();

  const remaining = members.filter((m) => !removed.has(characterKey(m)));
  const remainingKeys = new Set(remaining.map(characterKey));

  const added: CharacterRef[] = addedRows.map(({ name, surname, region }) => ({
    name: name.trim(),
    surname: surname.trim(),
    region,
  }));
  const alreadyInLadder = added.find((c) => remainingKeys.has(characterKey(c)));

  const errorMessage =
    formatDuplicateMessage(
      (duplicate && formatCharacterName(duplicate)) ??
        (alreadyInLadder ? formatCharacterName(alreadyInLadder) : null),
    ) ??
    formatNotFoundMessage(notFoundRows.map(formatCharacterName), NOT_FOUND_HINT) ??
    submitError;

  const hasPendingRows = rows.some(
    (r) =>
      r.status === 'checking' || (r.status === 'draft' && (!!r.name.trim() || !!r.surname.trim())),
  );
  const canSave =
    !isSubmitting &&
    (removed.size > 0 || added.length > 0) &&
    !hasPendingRows &&
    notFoundRows.length === 0 &&
    !alreadyInLadder;

  const removeMember = (member: CharacterRef) =>
    setRemoved((prev) => new Set(prev).add(characterKey(member)));

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
    rows,
    canSave,
    errorMessage,
    isSubmitting,
    removeMember,
    updateRow,
    verifyRow,
    removeRow,
    handleSubmit,
  };
}
