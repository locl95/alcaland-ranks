import { useState } from 'react';
import { VerifyResult } from '@/features/views/api/view-types.ts';
import { CheckStatus } from '@/features/views/components/shared/verification-badge.tsx';

export type EntityRow<F> = F & { id: string; status: 'draft' | CheckStatus };

interface EntityRowsOptions<F> {
  emptyFields: () => F;
  keyOf: (fields: F) => string | null;
  isBlank: (fields: F) => boolean;
  verify: (fields: F) => Promise<VerifyResult>;
  growsOnVerify: boolean;
}

const isAdded = <F>(row: EntityRow<F>) => row.status === 'valid' || row.status === 'unverified';

export function useEntityRows<F extends object>({
  emptyFields,
  keyOf,
  isBlank,
  verify,
  growsOnVerify,
}: EntityRowsOptions<F>) {
  const emptyRow = (): EntityRow<F> => ({
    ...emptyFields(),
    id: crypto.randomUUID(),
    status: 'draft',
  });

  const [rows, setRows] = useState<EntityRow<F>[]>(() => [emptyRow()]);
  const [duplicate, setDuplicate] = useState<EntityRow<F> | null>(null);

  const updateRow = (id: string, changes: Partial<F>) => {
    setDuplicate(null);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes, status: 'draft' } : r)));
  };

  const verifyRow = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    const key = row && keyOf(row);
    if (!row || !key) return;

    if (rows.some((r) => r.id !== id && r.status !== 'draft' && keyOf(r) === key)) {
      setDuplicate(row);
      return;
    }
    setDuplicate(null);

    const grows = growsOnVerify && rows[rows.length - 1].id === id;
    setRows((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, status: 'checking' as const } : r));
      return grows ? [...updated, emptyRow()] : updated;
    });

    const result = await verify(row);

    setRows((prev) =>
      prev.map((r) =>
        r.id === id && r.status === 'checking' && keyOf(r) === key ? { ...r, status: result } : r,
      ),
    );
  };

  const removeRow = (id: string) => {
    setDuplicate(null);
    setRows((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      return updated.length ? updated : [emptyRow()];
    });
  };

  const reset = () => {
    setDuplicate(null);
    setRows([emptyRow()]);
  };

  const addedRows = rows.filter(isAdded);
  const notFoundRows = rows.filter((r) => r.status === 'invalid');
  /** A row is still being verified, or has been typed but not added. */
  const hasUnfinishedRows = rows.some(
    (r) => r.status === 'checking' || (r.status === 'draft' && !isBlank(r)),
  );
  const isReady = addedRows.length > 0 && notFoundRows.length === 0 && !hasUnfinishedRows;

  return {
    rows,
    updateRow,
    verifyRow,
    removeRow,
    reset,
    addedRows,
    notFoundRows,
    duplicate,
    hasUnfinishedRows,
    isReady,
  };
}

export type EntityRows<F extends object> = ReturnType<typeof useEntityRows<F>>;
