import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageSize } from '@/features/views/model/page-size.ts';
import { PageSizeControl } from '@/features/views/hooks/usePageSize.ts';
import '@/features/views/components/shared/form-controls.css';
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
  /** Lets the viewer pick how many rows a page shows. */
  pageSize?: PageSizeControl;
}

const sizeLabel = (size: PageSize) => (size === 'all' ? 'All' : String(size));

export function Pager({ label, pagination, pageSize }: Readonly<PagerProps>) {
  const { page, pageCount, startIndex, count, total, goFirst, goPrev, goNext, goLast } = pagination;
  const canPickSize = !!pageSize && pageSize.options.length > 0;

  // With everything on one page there is nothing to page through, but showing the whole
  // ladder must still be undoable.
  if (pageCount <= 1 && !canPickSize) return null;

  const range =
    count === 0 ? `0 of ${total}` : `${startIndex + 1}–${startIndex + count} of ${total}`;

  return (
    <nav className="pager" aria-label={label}>
      <span className="pager-range eyebrow" aria-live="polite">
        {range}
      </span>
      <div className="pager-controls">
        {canPickSize && (
          <label className="pager-size">
            <span className="eyebrow">Show</span>
            <select
              className="form-select pager-size-select"
              value={pageSize.size}
              onChange={(e) => {
                const { value } = e.target;
                pageSize.pick(value === 'all' ? value : (Number(value) as PageSize));
                goFirst();
              }}
            >
              {pageSize.options.map((size) => (
                <option key={size} value={size}>
                  {sizeLabel(size)}
                </option>
              ))}
            </select>
          </label>
        )}
        {pageCount > 1 && (
          <>
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
          </>
        )}
      </div>
    </nav>
  );
}
