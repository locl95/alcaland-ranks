import {ViewMetadata} from "@/app/utils/views/ViewMetaData";
import {SimpleView} from "@/app/utils/views/SimpleView";


export interface GetViewsResponse {
    metadata?: ViewMetadata | null
    records: SimpleView[]
}
