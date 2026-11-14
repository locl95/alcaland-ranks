import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyCharacter, verifyGuild } from './forever-entity-api.ts';

const mockServiceRequest = vi.fn();

vi.mock('@/shared/api/httpClient.ts', () => ({
  serviceRequest: (...args: unknown[]) => mockServiceRequest(...args),
}));

const DAXAN = { name: 'Daxan', surname: 'Windfury', region: 'eu' };
// The backend answers with the names it stored, in lower case.
const STORED = { name: 'daxan', surname: 'windfury', region: 'eu' };

describe('verifyCharacter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is valid when the backend found the character', async () => {
    mockServiceRequest.mockResolvedValue({ exist: [STORED], nonExisting: [], unchecked: [] });
    expect(await verifyCharacter(DAXAN)).toBe('valid');
  });

  it('is invalid when Blizzard does not know the character', async () => {
    mockServiceRequest.mockResolvedValue({ exist: [], nonExisting: [STORED], unchecked: [] });
    expect(await verifyCharacter(DAXAN)).toBe('invalid');
  });

  it('is unverified when Blizzard could not be asked', async () => {
    mockServiceRequest.mockResolvedValue({ exist: [], nonExisting: [], unchecked: [STORED] });
    expect(await verifyCharacter(DAXAN)).toBe('unverified');
  });

  it('is unverified when the request fails', async () => {
    mockServiceRequest.mockRejectedValue(new Error('network'));
    expect(await verifyCharacter(DAXAN)).toBe('unverified');
  });
});

describe('verifyGuild', () => {
  const TSALAB = { name: ' TSALAB ', surname: '', region: 'eu' };

  beforeEach(() => vi.clearAllMocks());

  it('asks by name and region in WoW Forever, with no realm or surname', async () => {
    mockServiceRequest.mockResolvedValue({ guild: null });
    await verifyGuild(TSALAB);

    expect(mockServiceRequest).toHaveBeenCalledWith('POST', '/entities/exists/guild', {
      game: 'WOW_FOREVER',
      name: 'TSALAB',
      region: 'eu',
    });
  });

  it('is valid when the backend found the guild', async () => {
    mockServiceRequest.mockResolvedValue({
      guild: { type: 'wow_forever', name: 'tsalab', region: 'eu', blizzardId: 104078 },
    });
    expect(await verifyGuild(TSALAB)).toBe('valid');
  });

  it('is invalid when Blizzard does not know the guild', async () => {
    mockServiceRequest.mockResolvedValue({ guild: null });
    expect(await verifyGuild(TSALAB)).toBe('invalid');
  });

  it('is unverified when the request fails', async () => {
    mockServiceRequest.mockRejectedValue(new Error('503'));
    expect(await verifyGuild(TSALAB)).toBe('unverified');
  });
});
