import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/shared/components/toaster/ToastProvider.tsx';
import { ApiError } from '@/shared/api/ApiError.ts';
import { OperationResult } from '@/features/views/api/view-types.ts';
import { viewKeys } from '@/features/views/api/viewQueries.ts';
import { useSaveEntities } from './useSaveEntities.ts';

const mockUserRequest = vi.fn();
const mockServiceGet = vi.fn();
const mockPollOperation = vi.fn();

vi.mock('@/shared/api/httpClient.ts', () => ({
  userRequest: (...args: unknown[]) => mockUserRequest(...args),
  serviceGet: (...args: unknown[]) => mockServiceGet(...args),
}));

vi.mock('@/features/views/api/viewQueries.ts', async () => {
  const actual = await vi.importActual<typeof import('@/features/views/api/viewQueries.ts')>(
    '@/features/views/api/viewQueries.ts',
  );
  return { ...actual, pollOperation: (...args: unknown[]) => mockPollOperation(...args) };
});

const VIEW_ID = '12345678-1234-1234-1234-123456789012';

// /data rows carry more than the entity the ladder is edited with, as both games' rows do.
interface Row {
  name: string;
  score: number;
}
const row = (name: string): Row => ({ name, score: 100 });

const OPTIONS = {
  game: 'LOL' as const,
  noun: 'players',
  fromData: (r: Row) => r.name,
  key: (name: string) => name.toLowerCase(),
  toRequest: (name: string) => ({ type: 'lol', name }),
};

const renderSave = (data: Row[] = [row('Faker'), row('Caps')]) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
  const hook = renderHook(() => useSaveEntities(VIEW_ID, 'Squad', data, OPTIONS), { wrapper });
  return { ...hook, queryClient };
};

/** Lets a test decide when the backend operation ends. */
const holdOperation = () => {
  let finish!: (operation: OperationResult) => void;
  mockPollOperation.mockReturnValue(new Promise((resolve) => (finish = resolve)));
  return (status: OperationResult['status']) => act(async () => finish({ id: 'op-1', status }));
};

describe('useSaveEntities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRequest.mockResolvedValue({ id: 'op-1' });
    mockServiceGet.mockResolvedValue({ viewName: 'Squad', data: [row('Faker'), row('Chovy')] });
  });

  it('does nothing when the entities have not changed', async () => {
    const { result } = renderSave();

    await act(() => result.current.save(['faker', 'CAPS']));

    expect(mockUserRequest).not.toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });

  it('sends the whole entity list for the view’s game', async () => {
    holdOperation();
    const { result } = renderSave();

    await act(() => result.current.save(['Faker', 'Chovy']));

    expect(mockUserRequest).toHaveBeenCalledWith('PUT', `/views/${VIEW_ID}`, {
      name: 'Squad',
      entities: [
        { type: 'lol', name: 'Faker' },
        { type: 'lol', name: 'Chovy' },
      ],
      published: true,
      featured: false,
      game: 'LOL',
    });
  });

  it('keeps added entities syncing and removed ones deleting until the refreshed data is in', async () => {
    const finish = holdOperation();
    const { result, queryClient } = renderSave();

    await act(() => result.current.save(['Faker', 'Chovy']));

    expect(result.current.isSaving).toBe(true);
    expect(result.current.pending).toEqual([
      { entity: 'Chovy', status: 'syncing' },
      { entity: 'Caps', status: 'deleting' },
    ]);

    await finish('COMPLETED');

    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(result.current.pending).toEqual([]);
    expect(result.current.failed).toEqual([]);
    expect(queryClient.getQueryData(viewKeys.data(VIEW_ID))).toEqual({
      viewName: 'Squad',
      data: [row('Faker'), row('Chovy')],
    });
  });

  it('reports the entities that were neither added nor removed when the operation fails', async () => {
    const finish = holdOperation();
    mockServiceGet.mockResolvedValue({ viewName: 'Squad', data: [row('Faker'), row('Caps')] });
    const { result } = renderSave();

    await act(() => result.current.save(['Faker', 'Chovy']));
    await finish('FAILED');

    await waitFor(() => expect(result.current.failed).toEqual(['Chovy', 'Caps']));
    expect(result.current.isSaving).toBe(false);

    act(() => result.current.clearFailed());
    expect(result.current.failed).toEqual([]);
  });

  it('reports an added entity that never synced even when the operation completes', async () => {
    // The backend completes the operation when a single entity fails; it just never shows up.
    const finish = holdOperation();
    mockServiceGet.mockResolvedValue({ viewName: 'Squad', data: [row('Faker')] });
    const { result } = renderSave();

    await act(() => result.current.save(['Faker', 'Chovy']));
    await finish('COMPLETED');

    await waitFor(() => expect(result.current.failed).toEqual(['Chovy']));
    expect(result.current.isSaving).toBe(false);
  });

  it('names the entities in the limit message', async () => {
    mockUserRequest.mockRejectedValue(new ApiError(400, 'too many', 'TOO_MANY_ENTITIES'));
    const { result } = renderSave();

    let message: string | null = null;
    await act(async () => {
      message = await result.current.save(['Faker', 'Chovy', 'Caps']);
    });

    expect(message).toBe('This ladder has more players than allowed.');
    expect(result.current.isSaving).toBe(false);
  });

  it('drops the pending entities and refreshes the data when waiting for the operation fails', async () => {
    mockPollOperation.mockRejectedValue(new Error('network'));
    const { result, queryClient } = renderSave();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(() => result.current.save(['Faker', 'Chovy']));

    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: viewKeys.data(VIEW_ID) });
  });
});
