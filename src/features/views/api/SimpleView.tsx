import {ViewExtraArguments} from "@/app/utils/views/ViewExtraArguments";

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