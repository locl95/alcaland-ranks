import { FormEvent, useState } from 'react';
import { View } from '@/features/views/model/view.ts';
import { userRequest } from '@/shared/api/httpClient.ts';
import { ApiError } from '@/shared/api/ApiError.ts';
import { CheckStatus } from '@/features/views/components/shared/verification-badge.tsx';
import { formatDuplicateMessage } from '@/features/views/utils.ts';
import { parseRiotId, riotIdKey } from './riot-id.ts';
import { verifyRiotId } from './lol-entity-api.ts';

export interface PlayerRow {
  id: string;
  riotId: string;
  status: 'draft' | CheckStatus;
}

const LIMIT_ERRORS: Record<string, string> = {
  TOO_MANY_VIEWS: "You've reached the maximum number of ladders.",
  TOO_MANY_ENTITIES: 'This ladder has more players than allowed.',
};

const isSubmittable = (row: PlayerRow) => row.status === 'valid' || row.status === 'unverified';

const keyOf = (row: PlayerRow): string | null => {
  const parsed = parseRiotId(row.riotId);
  return parsed && riotIdKey(parsed);
};

const emptyRow = (): PlayerRow => ({ id: crypto.randomUUID(), riotId: '', status: 'draft' });

const formatNotFoundMessage = (riotIds: string[]): string | null =>
  riotIds.length === 0
    ? null
    : `${riotIds.join(', ')} ${riotIds.length === 1 ? 'was' : 'were'} not found. Check the Riot ID.`;

export function useCreateLolViewForm(onClose: () => void, onCreateView: (view: View) => void) {
  const [name, setName] = useState('');
  const [rows, setRows] = useState<PlayerRow[]>(() => [emptyRow()]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicateRiotId, setDuplicateRiotId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateRow = (id: string, riotId: string) => {
    setDuplicateRiotId(null);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, riotId, status: 'draft' } : r)));
  };

  const verifyRow = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    const riotId = row && parseRiotId(row.riotId);
    if (!riotId) return;

    const key = riotIdKey(riotId);
    if (rows.some((r) => r.id !== id && r.status !== 'draft' && keyOf(r) === key)) {
      setDuplicateRiotId(row.riotId.trim());
      return;
    }
    setDuplicateRiotId(null);

    const isLastRow = rows[rows.length - 1].id === id;
    setRows((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, status: 'checking' as const } : r));
      return isLastRow ? [...updated, emptyRow()] : updated;
    });

    const result = await verifyRiotId(riotId);

    setRows((prev) =>
      prev.map((r) =>
        r.id === id && r.status === 'checking' && keyOf(r) === key ? { ...r, status: result } : r,
      ),
    );
  };

  const removeRow = (id: string) => {
    setDuplicateRiotId(null);
    setRows((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      return updated.length ? updated : [emptyRow()];
    });
  };

  const notFound = rows.filter((r) => r.status === 'invalid');
  const errorMessage =
    formatDuplicateMessage(duplicateRiotId) ??
    formatNotFoundMessage(notFound.map((r) => r.riotId.trim())) ??
    submitError;

  const addedPlayers = rows.filter(isSubmittable).flatMap((r) => parseRiotId(r.riotId) ?? []);
  const hasUnverifiedInput = rows.some((r) => r.status === 'draft' && !!r.riotId.trim());
  const canSubmit =
    !isSubmitting &&
    !!name.trim() &&
    !hasUnverifiedInput &&
    notFound.length === 0 &&
    !rows.some((r) => r.status === 'checking') &&
    addedPlayers.length > 0;

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
    updateRow,
    verifyRow,
    removeRow,
    handleSubmit,
  };
}
