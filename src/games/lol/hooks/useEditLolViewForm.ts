import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchView, viewKeys } from '@/features/views/api/viewQueries.ts';
import { formatDuplicateMessage } from '@/features/views/utils.ts';
import {
  formatNotFoundMessage,
  parseRiotId,
  RiotId,
  riotIdKey,
} from '@/games/lol/model/riot-id.ts';
import { useRiotIdRows } from '@/games/lol/hooks/useRiotIdRows.ts';

export function useEditLolViewForm(
  viewId: string,
  onSave: (players: RiotId[]) => Promise<string | null>,
  onClose: () => void,
) {
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: view,
    isFetching,
    isError,
  } = useQuery({
    queryKey: viewKeys.detail(viewId),
    queryFn: () => fetchView<RiotId>(viewId),
    refetchOnMount: 'always',
    retry: false,
  });

  const { rows, updateRow, verifyRow, removeRow, addedRows, notFoundRows, duplicate } =
    useRiotIdRows();

  const members = isFetching ? null : (view?.entities ?? null);
  const remaining = (members ?? [])
    .map(({ name, tag }) => ({ name, tag }))
    .filter((m) => !removed.has(riotIdKey(m)));
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
    members !== null &&
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
    members: members && remaining,
    loadFailed: isError,
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
