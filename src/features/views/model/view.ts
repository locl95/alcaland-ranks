import { SimpleView } from "@/features/views/api/view-types.ts";

export type ViewStatus = "pending" | "synced";

export interface View {
  id: string;
  simpleView: SimpleView;
  status: ViewStatus;
}
