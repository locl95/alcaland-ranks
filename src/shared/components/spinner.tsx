import { useAppSelector } from "@/app/hooks.ts";
import { selectLoading } from "@/app/loadingSlice.ts";
import "./spinner.css";

export function Spinner() {
  const isLoading = useAppSelector(selectLoading);

  if (!isLoading) return null;

  return (
    <div className="spinner-overlay">
      <div className="spinner" />
    </div>
  );
}
