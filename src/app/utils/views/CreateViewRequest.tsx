export interface CreateViewRequest {
    "name": string,
    "entities": [],
    "published": boolean,
    "featured": boolean,
    "game": string
}

export interface WowEntityRequest {
    "name": string,
    "region": string,
    "realm": string,
    "type": string //"com.kos.entities.domain.WowEntityRequest"
}