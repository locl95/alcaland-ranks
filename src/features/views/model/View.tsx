import { SimpleView } from "@/features/views/api/SimpleView.tsx";

export interface View {
  id: string;
  simpleView: SimpleView;
  isSynced: boolean;
}
