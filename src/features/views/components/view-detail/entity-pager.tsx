import { ChevronLeft, ChevronRight } from 'lucide-react';
import './entity-pager.css';

interface EntityPagerProps {
  page: number;
  pageCount: number;
  startIndex: number;
  count: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function EntityPager({
  page,
  pageCount,
  startIndex,
  count,
  total,
  onPrev,
  onNext,
}: Readonly<EntityPagerProps>) {
  if (pageCount <= 1) return null;

  return (
    <nav className="entity-pager" aria-label="Ladder pages">
      <span className="entity-pager-range eyebrow" aria-live="polite">
        {`${startIndex + 1}–${startIndex + count} of ${total}`}
      </span>
      <div className="entity-pager-controls">
        <button
          type="button"
          className="entity-pager-btn"
          aria-label="Previous page"
          title="Previous page"
          onClick={onPrev}
          aria-disabled={page === 1}
        >
          <ChevronLeft className="entity-pager-icon" />
        </button>
        <button
          type="button"
          className="entity-pager-btn"
          aria-label="Next page"
          title="Next page"
          onClick={onNext}
          aria-disabled={page === pageCount}
        >
          <ChevronRight className="entity-pager-icon" />
        </button>
      </div>
    </nav>
  );
}
