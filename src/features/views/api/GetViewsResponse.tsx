import {ViewMetadata} from "@/features/views/api/ViewMetaData.tsx";
import {SimpleView} from "@/features/views/api/SimpleView.tsx";

export interface GetViewsResponse {
    metadata?: ViewMetadata | null
    records: SimpleView[]
}
