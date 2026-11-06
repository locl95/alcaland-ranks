import { FormEvent, useState } from 'react';
import { formatDuplicateMessage } from '@/features/views/utils.ts';
import {
  formatNotFoundMessage,
  parseRiotId,
  RiotId,
  riotIdKey,
} from '@/games/lol/model/riot-id.ts';
import { useRiotIdRows } from '@/games/lol/hooks/useRiotIdRows.ts';

export function useEditLolViewForm(
  members: RiotId[],
  onSave: (players: RiotId[]) => Promise<string | null>,
  onClose: () => void,
) {
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { rows, updateRow, verifyRow, removeRow, addedRows, notFoundRows, duplicate } =
    useRiotIdRows();

  const remaining = members.filter((m) => !removed.has(riotIdKey(m)));
  const remainingKeys = new Set(remaining.map(riotIdKey));

  const added = addedRows.flatMap((r) => parseRiotId(r.riotId) ?? []);
  const alreadyInLadder = added.find((p) => remainingKeys.has(riotIdKey(p)));

  const errorMessage =
    formatDuplicateMessage(
      (duplicate && duplicate.riotId.trim()) ??
        (alreadyInLadder ? `${alreadyInLadder.name}#${alreadyInLadder.tag}` : null),
    ) ??
    formatNotFoundMessage(notFoundRows.map((r) => r.riotId.trim())) ??
    submitError;

  const hasPendingRows = rows.some(
    (r) => r.status === 'checking' || (r.status === 'draft' && !!r.riotId.trim()),
  );
  const canSave =
    !isSubmitting &&
    (removed.size > 0 || added.length > 0) &&
    !hasPendingRows &&
    notFoundRows.length === 0 &&
    !alreadyInLadder;

  const removeMember = (member: RiotId) =>
    setRemoved((prev) => new Set(prev).add(riotIdKey(member)));

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
    updateRow: (id: string, riotId: string) => updateRow(id, { riotId }),
    verifyRow,
    removeRow,
    handleSubmit,
  };
}
