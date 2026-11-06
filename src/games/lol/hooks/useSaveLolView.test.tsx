import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/shared/components/toaster/ToastProvider.tsx';
import { OperationResult } from '@/features/views/api/view-types.ts';
import { useSaveLolView } from './useSaveLolView.ts';

const mockUserRequest = vi.fn();
const mockPollOperation = vi.fn();

vi.mock('@/shared/api/httpClient.ts', () => ({
  userRequest: (...args: unknown[]) => mockUserRequest(...args),
}));

vi.mock('@/features/views/api/viewQueries.ts', async () => {
  const actual = await vi.importActual<typeof import('@/features/views/api/viewQueries.ts')>(
    '@/features/views/api/viewQueries.ts',
  );
  return { ...actual, pollOperation: (...args: unknown[]) => mockPollOperation(...args) };
});

const VIEW_ID = '12345678-1234-1234-1234-123456789012';
const CURRENT = [
  { name: 'Faker', tag: 'KR1' },
  { name: 'Caps', tag: 'EUW' },
];

const renderSave = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useSaveLolView(VIEW_ID, 'Flex Squad', CURRENT), { wrapper });
};

describe('useSaveLolView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRequest.mockResolvedValue({ id: 'op-1' });
  });

  it('marks added players as syncing and removed ones as deleting until the operation ends', async () => {
    let finish!: (operation: OperationResult) => void;
    mockPollOperation.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { result } = renderSave();

    await act(() =>
      result.current.save([
        { name: 'Faker', tag: 'KR1' },
        { name: 'Chovy', tag: 'KR2' },
      ]),
    );

    expect(result.current.isSaving).toBe(true);
    expect(result.current.pending).toEqual([
      { name: 'Chovy', tag: 'KR2', status: 'syncing' },
      { name: 'Caps', tag: 'EUW', status: 'deleting' },
    ]);

    await act(async () => finish({ id: 'op-1', status: 'COMPLETED' }));

    await waitFor(() => expect(result.current.pending).toEqual([]));
    expect(result.current.isSaving).toBe(false);
  });

  it('marks nothing as pending when the save is rejected', async () => {
    mockUserRequest.mockRejectedValue(new Error('boom'));
    const { result } = renderSave();

    let message: string | null = null;
    await act(async () => {
      message = await result.current.save([{ name: 'Chovy', tag: 'KR2' }]);
    });

    expect(message).toBe('Failed to save changes — please try again');
    expect(result.current.pending).toEqual([]);
    expect(result.current.isSaving).toBe(false);
  });
});
