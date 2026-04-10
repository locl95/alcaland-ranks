export interface ViewExtraArguments {
  [key: string]: unknown;
}

export interface ViewMetadata {
  totalCount?: number | null;
}

export type Game = "WOW";

export interface SimpleView {
  id: string;
  name: string;
  owner: string;
  published: boolean;
  entitiesIds: number[];
  game: Game;
  featured: boolean;
  extraArguments?: ViewExtraArguments | null;
}

export interface GetViewsResponse {
  metadata?: ViewMetadata | null;
  records: SimpleView[];
}

export interface WowEntityRequest {
  name: string;
  region: string;
  realm: string;
  type: string; //"com.kos.entities.domain.WowEntityRequest"
}

export interface ViewRequest {
  name: string;
  entities: WowEntityRequest[];
  published: boolean;
  featured: boolean;
  game: string;
}
