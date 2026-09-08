import { FormEvent, useState } from 'react';
import { View } from '@/features/views/model/view.ts';
import { userRequest } from '@/shared/api/httpClient.ts';
import { entityKey, verifyEntity, verifyGuild } from '@/features/views/api/entityApi.ts';
import { CheckStatus } from '@/features/views/components/shared/verification-badge.tsx';
import { formatDuplicateMessage, formatNotFoundMessage } from '@/features/views/utils.ts';

type RowStatus = 'draft' | CheckStatus;

export type CreateMode = 'characters' | 'guild';

export interface EntityRow {
  id: string;
  name: string;
  realm: string;
  region: string;
  status: RowStatus;
}

const GUILD_EXTRA_ARGUMENTS = {
  type: 'com.kos.views.WowExtraArguments',
  guild: 'RESOLVE',
  season: 0,
};

const isSubmittable = (row: EntityRow) => row.status === 'valid' || row.status === 'unverified';

const isCommitted = (row: EntityRow) => row.status !== 'draft';

const emptyRow = (): EntityRow => ({
  id: crypto.randomUUID(),
  name: '',
  realm: '',
  region: 'eu',
  status: 'draft',
});

export function useCreateViewForm(onClose: () => void, onCreateView: (view: View) => void) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<CreateMode>('characters');
  const [rows, setRows] = useState<EntityRow[]>(() => [emptyRow()]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectMode = (next: CreateMode) => {
    if (next === mode) return;
    setMode(next);
    setRows([emptyRow()]);
    setDuplicateName(null);
    setSubmitError(null);
  };

  const updateRow = (id: string, field: 'name' | 'realm' | 'region', value: string) => {
    setDuplicateName(null);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value, status: 'draft' } : r)),
    );
  };

  const verifyRow = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row?.name.trim() || !row.realm) return;

    const entity = { name: row.name.trim(), region: row.region, realm: row.realm };
    const key = entityKey(entity);

    if (rows.some((r) => r.id !== id && isCommitted(r) && entityKey(r) === key)) {
      setDuplicateName(entity.name);
      return;
    }
    setDuplicateName(null);

    const isLastRow = mode === 'characters' && rows[rows.length - 1].id === id;
    setRows((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, status: 'checking' as const } : r));
      return isLastRow ? [...updated, emptyRow()] : updated;
    });

    const result = mode === 'guild' ? await verifyGuild(entity) : await verifyEntity(entity);

    setRows((prev) =>
      prev.map((r) =>
        r.id === id && r.status === 'checking' && entityKey(r) === key
          ? { ...r, status: result }
          : r,
      ),
    );
  };

  const removeRow = (id: string) => {
    setDuplicateName(null);
    setRows((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      return updated.length ? updated : [emptyRow()];
    });
  };

  const notFound = rows.filter((r) => r.status === 'invalid');
  const errorMessage =
    formatDuplicateMessage(duplicateName) ??
    formatNotFoundMessage(notFound.map((r) => r.name.trim())) ??
    submitError;

  const hasUnverifiedInput = rows.some((r) => r.status === 'draft' && !!r.name.trim());
  const canSubmit =
    !isSubmitting &&
    !!name.trim() &&
    !hasUnverifiedInput &&
    notFound.length === 0 &&
    !rows.some((r) => r.status === 'checking') &&
    rows.some(isSubmittable);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitError(null);
    setIsSubmitting(true);

    const addedRows = rows.filter(isSubmittable);
    const extraArguments = mode === 'guild' ? GUILD_EXTRA_ARGUMENTS : null;

    try {
      const { id: operationId } = await userRequest<{ id: string }>('POST', '/views', {
        name,
        entities: addedRows.map((r) => ({
          name: r.name.trim(),
          region: r.region,
          realm: r.realm,
          type: 'com.kos.entities.domain.WowEntityRequest',
        })),
        published: true,
        featured: false,
        game: 'WOW',
        ...(extraArguments && { extraArguments }),
      });

      onCreateView({
        operationId,
        simpleView: {
          id: operationId,
          name,
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
    } catch {
      setSubmitError(
        mode === 'guild'
          ? 'Failed to create guild ladder. Please try again.'
          : 'Failed to create ladder. Please try again.',
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
