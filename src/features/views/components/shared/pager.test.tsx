import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Pager, Pagination } from './pager.tsx';

const makePagination = (overrides: Partial<Pagination> = {}): Pagination => ({
  page: 1,
  pageCount: 2,
  startIndex: 0,
  count: 10,
  total: 15,
  goFirst: vi.fn(),
  goPrev: vi.fn(),
  goNext: vi.fn(),
  goLast: vi.fn(),
  ...overrides,
});

const lastPage = { page: 2, startIndex: 10, count: 5 };

const renderPager = (overrides: Partial<Pagination> = {}) => {
  const pagination = makePagination(overrides);
  const result = render(<Pager label="Ladder pages" pagination={pagination} />);
  return { ...result, pagination };
};

beforeEach(() => vi.clearAllMocks());

describe('Pager', () => {
  it('renders nothing when everyone fits on one page', () => {
    const { container } = renderPager({ pageCount: 1, total: 8 });

    expect(container).toBeEmptyDOMElement();
  });

  it('states which characters are on screen', () => {
    renderPager();

    expect(screen.getByText('1–10 of 15')).toBeInTheDocument();
  });

  it('counts the last page from its offset, not from a full page', () => {
    renderPager(lastPage);

    expect(screen.getByText('11–15 of 15')).toBeInTheDocument();
  });

  it('does not invent a range when the page came back empty', () => {
    renderPager({ page: 5, startIndex: 40, count: 0, pageCount: 5, total: 45 });

    expect(screen.getByText('0 of 45')).toBeInTheDocument();
    expect(screen.queryByText('41–40 of 45')).not.toBeInTheDocument();
  });

  it('dims Previous on the first page and Next on the last, keeping both focusable', () => {
    const { rerender, pagination } = renderPager();

    expect(screen.getByRole('button', { name: /previous/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: /next/i })).toHaveAttribute('aria-disabled', 'false');

    rerender(<Pager label="Ladder pages" pagination={{ ...pagination, ...lastPage }} />);

    expect(screen.getByRole('button', { name: /previous/i })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
    expect(screen.getByRole('button', { name: /next/i })).toHaveAttribute('aria-disabled', 'true');
    // Still focusable at the end of the run, so a keyboard user does not lose their place.
    screen.getByRole('button', { name: /next/i }).focus();
    expect(screen.getByRole('button', { name: /next/i })).toHaveFocus();
  });

  it('dims First on the first page and Last on the last', () => {
    const { rerender, pagination } = renderPager();

    expect(screen.getByRole('button', { name: /first/i })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: /last/i })).toHaveAttribute('aria-disabled', 'false');

    rerender(<Pager label="Ladder pages" pagination={{ ...pagination, ...lastPage }} />);

    expect(screen.getByRole('button', { name: /first/i })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
    expect(screen.getByRole('button', { name: /last/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('wires each button to its own control', async () => {
    const { pagination } = renderPager(lastPage);

    await userEvent.click(screen.getByRole('button', { name: /first/i }));
    await userEvent.click(screen.getByRole('button', { name: /previous/i }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /last/i }));

    expect(pagination.goFirst).toHaveBeenCalledTimes(1);
    expect(pagination.goPrev).toHaveBeenCalledTimes(1);
    expect(pagination.goNext).toHaveBeenCalledTimes(1);
    expect(pagination.goLast).toHaveBeenCalledTimes(1);
  });
});
