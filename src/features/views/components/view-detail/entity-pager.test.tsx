import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EntityPager } from './entity-pager.tsx';

const defaultProps = {
  page: 1,
  pageCount: 2,
  startIndex: 0,
  count: 10,
  total: 15,
  onPrev: vi.fn(),
  onNext: vi.fn(),
};

describe('EntityPager', () => {
  it('renders nothing when everyone fits on one page', () => {
    const { container } = render(
      <EntityPager {...defaultProps} pageCount={1} total={8} onPrev={vi.fn()} onNext={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('states which characters are on screen', () => {
    render(<EntityPager {...defaultProps} onPrev={vi.fn()} onNext={vi.fn()} />);

    expect(screen.getByText('1–10 of 15')).toBeInTheDocument();
  });

  it('counts the last page from its offset, not from a full page', () => {
    render(
      <EntityPager
        {...defaultProps}
        page={2}
        startIndex={10}
        count={5}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByText('11–15 of 15')).toBeInTheDocument();
  });

  it('dims Previous on the first page and Next on the last, keeping both focusable', () => {
    const { rerender } = render(
      <EntityPager {...defaultProps} onPrev={vi.fn()} onNext={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: /previous/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: /next/i })).toHaveAttribute('aria-disabled', 'false');

    rerender(
      <EntityPager
        {...defaultProps}
        page={2}
        startIndex={10}
        count={5}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /previous/i })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
    expect(screen.getByRole('button', { name: /next/i })).toHaveAttribute('aria-disabled', 'true');
    // Still focusable at the end of the run, so a keyboard user does not lose their place.
    screen.getByRole('button', { name: /next/i }).focus();
    expect(screen.getByRole('button', { name: /next/i })).toHaveFocus();
  });

  it('calls back when a page button is pressed', async () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(
      <EntityPager
        {...defaultProps}
        page={2}
        startIndex={10}
        count={5}
        onPrev={onPrev}
        onNext={onNext}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /previous/i }));

    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });
});
