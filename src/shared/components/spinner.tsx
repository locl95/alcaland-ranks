import { useAppSelector } from "@/app/hooks.ts";
import { selectLoading } from "@/features/loading/loadingSlice.ts";
import "@/styles/shared/spinner.css";

export function Spinner() {
  const isLoading = useAppSelector(selectLoading);

  if (!isLoading) return null;

  return (
    <div className="spinner-overlay">
      <div className="spinner" />
    </div>
  );
}
