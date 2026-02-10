import { ViewMetadata } from "./ViewMetaData"
import { SimpleView } from "./SimpleView"

export interface GetViewsResponse {
    metadata?: ViewMetadata | null
    records: SimpleView[]
}
