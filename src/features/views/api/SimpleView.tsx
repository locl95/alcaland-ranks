import {ViewExtraArguments} from "@/features/views/api/ViewExtraArguments.tsx";

export interface SimpleView {
    id: string
    name: string
    owner: string
    published: boolean
    entitiesIds: number[]
    game: Game
    featured: boolean
    extraArguments?: ViewExtraArguments | null
}

export type Game = "WOW"