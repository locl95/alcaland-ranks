import { serviceRequest } from '@/shared/api/httpClient.ts';

export interface EntityRef {
  name: string;
  region: string;
  realm: string;
}

export interface EntitiesExistResponse {
  exist: EntityRef[];
  nonExisting: EntityRef[];
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

export type VerifyResult = 'valid' | 'invalid' | 'unverified';

export const entityKey = ({ name, realm, region }: EntityRef): string =>
  `${name.trim().toLowerCase()}|${realm}|${region}`;

export async function verifyEntity(entity: EntityRef): Promise<VerifyResult> {
  try {
    const { nonExisting } = await checkEntitiesExist([entity]);
    return nonExisting.some((n) => entityKey(n) === entityKey(entity)) ? 'invalid' : 'valid';
  } catch {
    return 'unverified';
  }
}
