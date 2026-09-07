import { serviceRequest } from '@/shared/api/httpClient.ts';

export interface EntityRef {
  name: string;
  region: string;
  realm: string;
}

export interface EntitiesExistResponse {
  exist: EntityRef[];
  nonExisting: EntityRef[];
  unchecked: EntityRef[];
}

export async function checkEntitiesExist(entities: EntityRef[]): Promise<EntitiesExistResponse> {
  return serviceRequest<EntitiesExistResponse>('POST', '/entities/exists', {
    entities: entities.map(({ name, region, realm }) => ({
      type: 'com.kos.entities.domain.WowEntityRequest',
      name,
      region,
      realm,
    })),
    game: 'WOW',
  });
}

export interface GuildExistsResponse {
  guild: { name: string; realm: string; region: string; blizzardId: number } | null;
}

export type VerifyResult = 'valid' | 'invalid' | 'unverified';

export const entityKey = ({ name, realm, region }: EntityRef): string =>
  `${name.trim().toLowerCase()}|${realm}|${region}`;

export async function verifyEntity(entity: EntityRef): Promise<VerifyResult> {
  const key = entityKey(entity);
  try {
    const { nonExisting, unchecked } = await checkEntitiesExist([entity]);
    if (nonExisting.some((n) => entityKey(n) === key)) return 'invalid';
    if (unchecked.some((u) => entityKey(u) === key)) return 'unverified';
    return 'valid';
  } catch {
    return 'unverified';
  }
}

// Always answers 200: a guild that does not exist comes back as `guild: null`, not as an
// error status. Only WOW retail — the game is fixed backend-side and not part of the body.
export async function verifyGuild({ name, region, realm }: EntityRef): Promise<VerifyResult> {
  try {
    const { guild } = await serviceRequest<GuildExistsResponse>('POST', '/entities/exists/guild', {
      name: name.trim(),
      region,
      realm,
    });
    return guild ? 'valid' : 'invalid';
  } catch {
    return 'unverified';
  }
}
