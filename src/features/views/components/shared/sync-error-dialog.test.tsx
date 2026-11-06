import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SyncErrorDialog } from './sync-error-dialog.tsx';

const renderDialog = (items: { key: string; name: string; meta?: string }[], onClose = vi.fn()) =>
  render(
    <SyncErrorDialog
      title="Some characters couldn't be synced"
      description="Check the name, realm and region."
      items={items}
      onClose={onClose}
    />,
  );

describe('SyncErrorDialog', () => {
  it('renders nothing when there are no failed items', () => {
    const { container } = renderDialog([]);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists every failed item with its details', () => {
    renderDialog([
      { key: 'a', name: 'Arthas', meta: 'EU · Tarren Mill' },
      { key: 's', name: 'Sylvanas' },
    ]);
    expect(screen.getByText('Arthas')).toBeInTheDocument();
    expect(screen.getByText('EU · Tarren Mill')).toBeInTheDocument();
    expect(screen.getByText('Sylvanas')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    renderDialog([{ key: 'a', name: 'Arthas' }], onClose);
    await userEvent.click(screen.getByText('Got it'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
