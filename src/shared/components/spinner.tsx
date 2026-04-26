import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import "./spinner.css";

export function Spinner() {
  // Only count queries that are fetching for the first time (no cached data
  // yet). Background refetches and polling intervals have status 'success'
  // and should not trigger the spinner — they update silently.
  const isFetching = useIsFetching({
    predicate: (query) => query.state.status === "pending",
  });
  const isMutating = useIsMutating();

  if (!isFetching && !isMutating) return null;

  return (
    <div className="spinner-overlay">
      <div className="spinner" />
    </div>
  );
}
