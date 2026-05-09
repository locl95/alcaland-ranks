import { SimpleView } from "@/features/views/api/view-types.ts";

export type ViewStatus = "pending" | "synced";

export interface View {
  operationId: string | null;
  simpleView: SimpleView;
  status: ViewStatus;
}
