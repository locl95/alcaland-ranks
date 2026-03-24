export interface ViewRequest {
  name: string;
  entities: WowEntityRequest[];
  published: boolean;
  featured: boolean;
  game: string;
}

export interface WowEntityRequest {
  name: string;
  region: string;
  realm: string;
  type: string; //"com.kos.entities.domain.WowEntityRequest"
}
