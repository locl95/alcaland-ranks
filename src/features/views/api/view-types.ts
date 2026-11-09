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

export type Game = 'WOW' | 'LOL' | 'WOW_FOREVER';

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

export interface ViewResponse {
  owner: string;
  extraArguments?: ViewExtraArguments | null;
}

export interface GetViewsResponse {
  metadata?: ViewMetadata | null;
  records: SimpleView[];
}

export type OperationStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface OperationResult {
  id: string;
  status: OperationStatus;
  resourceId?: string;
}
