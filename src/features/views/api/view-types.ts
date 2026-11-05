export interface ViewExtraArguments {
  type: 'wow';
  isGuild: boolean;
}

export interface ViewDataResponse<T> {
  viewName: string;
  data: T[];
}

export interface ViewMetadata {
  totalCount?: number | null;
}

export type Game = 'WOW' | 'LOL';

export type VerifyResult = 'valid' | 'invalid' | 'unverified';

export interface SimpleView {
  id: string;
  name: string;
  owner: string;
  published: boolean;
  entitiesIds: number[];
  game: Game;
  featured: boolean;
  extraArguments?: ViewExtraArguments | null;
  lastSyncedAt?: string | null;
}

export interface ViewResponse<E = unknown> {
  owner: string;
  extraArguments?: ViewExtraArguments | null;
  entities?: E[];
}

export interface GetViewsResponse {
  metadata?: ViewMetadata | null;
  records: SimpleView[];
}

export interface WowEntityRequest {
  name: string;
  region: string;
  realm: string;
  type: 'wow';
}

export interface ViewRequest {
  name: string;
  entities: WowEntityRequest[];
  published: boolean;
  featured: boolean;
  game: string;
}

export type OperationStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface OperationResult {
  id: string;
  status: OperationStatus;
  resourceId?: string;
}
