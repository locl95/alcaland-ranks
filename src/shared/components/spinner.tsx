import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import './spinner.css';

export function Spinner() {
  const isFetching = useIsFetching({
    predicate: (query) => query.state.status === 'pending',
  });
  const isMutating = useIsMutating();

  if (!isFetching && !isMutating) return null;

  return (
    <div className="spinner-overlay">
      <div className="spinner" />
    </div>
  );
}
