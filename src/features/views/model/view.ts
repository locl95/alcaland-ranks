import { SimpleView } from "@/features/views/api/view-types.ts";

export interface View {
  id: string;
  simpleView: SimpleView;
  isSynced: boolean;
}
