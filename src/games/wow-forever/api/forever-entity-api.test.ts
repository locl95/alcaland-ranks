import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyCharacter } from './forever-entity-api.ts';

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
