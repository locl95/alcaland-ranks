import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormEvent } from 'react';
import { useCreateLolViewForm } from './useCreateLolViewForm.ts';

const mockUserRequest = vi.fn();
const mockServiceRequest = vi.fn();

vi.mock('@/shared/api/httpClient.ts', () => ({
  userRequest: (...args: unknown[]) => mockUserRequest(...args),
  serviceRequest: (...args: unknown[]) => mockServiceRequest(...args),
}));

const onClose = vi.fn();
const onCreateView = vi.fn();

const renderForm = () => renderHook(() => useCreateLolViewForm(onClose, onCreateView));

async function addPlayer(
  result: { current: ReturnType<typeof useCreateLolViewForm> },
  riotId: string,
) {
  const rowId = result.current.rows[result.current.rows.length - 1].id;
  act(() => result.current.updateRow(rowId, riotId));
  await act(async () => result.current.verifyRow(rowId));
}

describe('useCreateLolViewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRequest.mockResolvedValue({ id: 'op-123', resourceId: 'view-123' });
    mockServiceRequest.mockResolvedValue({ exist: [], nonExisting: [], unchecked: [] });
  });

  it('verifies a Riot ID as a LoL entity', async () => {
    const { result } = renderForm();
    await addPlayer(result, 'GTP ZeroMVPs#KAKO');

    expect(mockServiceRequest).toHaveBeenCalledWith('POST', '/entities/exists', {
      entities: [{ type: 'lol', name: 'GTP ZeroMVPs', tag: 'KAKO' }],
      game: 'LOL',
    });
    expect(result.current.rows[0].status).toBe('valid');
  });

  it('flags a Riot ID the backend cannot find and blocks submitting', async () => {
    mockServiceRequest.mockResolvedValue({
      exist: [],
      nonExisting: [{ name: 'Nobody', tag: 'EUW' }],
      unchecked: [],
    });
    const { result } = renderForm();
    act(() => result.current.setName('Squad'));
    await addPlayer(result, 'nobody#euw');

    expect(result.current.errorMessage).toBe('nobody#euw was not found. Check the Riot ID.');
    expect(result.current.canSubmit).toBe(false);
  });

  it('treats the same Riot ID in a different case as a duplicate', async () => {
    const { result } = renderForm();
    await addPlayer(result, 'Faker#KR1');
    await addPlayer(result, 'faker#kr1');

    expect(result.current.errorMessage).toBe('faker#kr1 is already in this ladder.');
    expect(mockServiceRequest).toHaveBeenCalledOnce();
  });

  it('creates a LoL ladder with the added players and hands back the pending view', async () => {
    const { result } = renderForm();
    act(() => result.current.setName('Squad'));
    await addPlayer(result, 'Faker#KR1');

    await act(async () =>
      result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent),
    );

    expect(mockUserRequest).toHaveBeenCalledWith('POST', '/views', {
      name: 'Squad',
      entities: [{ type: 'lol', name: 'Faker', tag: 'KR1' }],
      published: true,
      featured: false,
      game: 'LOL',
    });
    expect(onCreateView).toHaveBeenCalledWith(
      expect.objectContaining({
        operationId: 'op-123',
        status: 'pending',
        simpleView: expect.objectContaining({ id: 'view-123', game: 'LOL' }),
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
