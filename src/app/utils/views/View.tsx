import {SimpleView} from "@/app/utils/views/SimpleView.tsx";

export interface View {
    id: string,
    simpleView: SimpleView,
    isSynced: boolean
}