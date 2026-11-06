import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormEvent } from 'react';
import { CharacterRef } from '@/games/wow-forever/model/character.ts';
import { useCreateForeverViewForm } from './useCreateForeverViewForm.ts';

const mockUserRequest = vi.fn();
const mockServiceRequest = vi.fn();

vi.mock('@/shared/api/httpClient.ts', () => ({
  userRequest: (...args: unknown[]) => mockUserRequest(...args),
  serviceRequest: (...args: unknown[]) => mockServiceRequest(...args),
}));

const onClose = vi.fn();
const onCreateView = vi.fn();

const renderForm = () => renderHook(() => useCreateForeverViewForm(onClose, onCreateView));

async function addCharacter(
  result: { current: ReturnType<typeof useCreateForeverViewForm> },
  character: Partial<CharacterRef>,
) {
  const rowId = result.current.rows[result.current.rows.length - 1].id;
  act(() => result.current.updateRow(rowId, character));
  await act(async () => result.current.verifyRow(rowId));
}

const submit = (result: { current: ReturnType<typeof useCreateForeverViewForm> }) =>
  act(async () => result.current.handleSubmit({ preventDefault: () => {} } as FormEvent));

describe('useCreateForeverViewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRequest.mockResolvedValue({ id: 'op-123', resourceId: 'view-123' });
    mockServiceRequest.mockResolvedValue({ exist: [], nonExisting: [], unchecked: [] });
  });

  it('verifies a character by name, surname and region', async () => {
    const { result } = renderForm();
    await addCharacter(result, { name: 'Daxan', surname: 'Windfury', region: 'us' });

    expect(mockServiceRequest).toHaveBeenCalledWith('POST', '/entities/exists', {
      entities: [{ type: 'wow_forever', name: 'Daxan', surname: 'Windfury', region: 'us' }],
      game: 'WOW_FOREVER',
    });
    expect(result.current.rows[0].status).toBe('valid');
  });

  it('flags a character the backend cannot find and blocks submitting', async () => {
    mockServiceRequest.mockResolvedValue({
      exist: [],
      nonExisting: [{ name: 'nobody', surname: 'here', region: 'eu' }],
      unchecked: [],
    });
    const { result } = renderForm();
    act(() => result.current.setName('Crew'));
    await addCharacter(result, { name: 'Nobody', surname: 'Here' });

    expect(result.current.errorMessage).toBe(
      'Nobody Here was not found. Check the name, surname and region.',
    );
    expect(result.current.canSubmit).toBe(false);
  });

  it('treats the same character in a different case as a duplicate', async () => {
    const { result } = renderForm();
    await addCharacter(result, { name: 'Daxan', surname: 'Windfury' });
    await addCharacter(result, { name: 'daxan', surname: 'WINDFURY' });

    expect(result.current.errorMessage).toBe('daxan WINDFURY is already in this ladder.');
  });

  it('creates the ladder as a WoW Forever view', async () => {
    const { result } = renderForm();
    act(() => result.current.setName('Crew'));
    await addCharacter(result, { name: 'Daxan ', surname: 'Windfury' });
    await submit(result);

    expect(mockUserRequest).toHaveBeenCalledWith('POST', '/views', {
      name: 'Crew',
      entities: [{ type: 'wow_forever', name: 'Daxan', surname: 'Windfury', region: 'eu' }],
      published: true,
      featured: false,
      game: 'WOW_FOREVER',
    });
    expect(onCreateView).toHaveBeenCalledWith(
      expect.objectContaining({
        operationId: 'op-123',
        status: 'pending',
        simpleView: expect.objectContaining({ id: 'view-123', game: 'WOW_FOREVER' }),
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
