import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import './pager.css';

export interface Pagination {
  page: number;
  pageCount: number;
  startIndex: number;
  count: number;
  total: number;
  goFirst: () => void;
  goPrev: () => void;
  goNext: () => void;
  goLast: () => void;
}

interface PagerProps {
  label: string;
  pagination: Pagination;
}

export function Pager({ label, pagination }: Readonly<PagerProps>) {
  const { page, pageCount, startIndex, count, total, goFirst, goPrev, goNext, goLast } = pagination;

  if (pageCount <= 1) return null;

  const range =
    count === 0 ? `0 of ${total}` : `${startIndex + 1}–${startIndex + count} of ${total}`;

  return (
    <nav className="pager" aria-label={label}>
      <span className="pager-range eyebrow" aria-live="polite">
        {range}
      </span>
      <div className="pager-controls">
        <button
          type="button"
          className="pager-btn"
          aria-label="First page"
          title="First page"
          onClick={goFirst}
          aria-disabled={page === 1}
        >
          <ChevronFirst className="pager-icon" />
        </button>
        <button
          type="button"
          className="pager-btn"
          aria-label="Previous page"
          title="Previous page"
          onClick={goPrev}
          aria-disabled={page === 1}
        >
          <ChevronLeft className="pager-icon" />
        </button>
        <button
          type="button"
          className="pager-btn"
          aria-label="Next page"
          title="Next page"
          onClick={goNext}
          aria-disabled={page === pageCount}
        >
          <ChevronRight className="pager-icon" />
        </button>
        <button
          type="button"
          className="pager-btn"
          aria-label="Last page"
          title="Last page"
          onClick={goLast}
          aria-disabled={page === pageCount}
        >
          <ChevronLast className="pager-icon" />
        </button>
      </div>
    </nav>
  );
}
