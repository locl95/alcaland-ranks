import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CreateWowView } from './create-wow-view.tsx';

vi.mock('@/shared/api/httpClient.ts', () => ({ userRequest: vi.fn(), serviceRequest: vi.fn() }));

// The realm list is a popup inside the dialog. That Enter on it doesn't submit the form is
// RealmSelect's own to prove; Escape is the dialog's too, as Radix listens for it on its own.
describe('CreateWowView with the realm list open', () => {
  it('closes the list on Escape, and only the next Escape closes the dialog', async () => {
    const onClose = vi.fn();
    render(<CreateWowView onClose={onClose} onCreateView={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Realm'), 'sangu');
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });
});
