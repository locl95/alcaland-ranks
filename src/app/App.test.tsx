import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from './App';

vi.mock('@/features/views/components/views-page/views-page.tsx', () => ({
  ViewsPage: () => <div data-testid="views-page" />,
}));

vi.mock('@/features/views/components/view-detail/view-detail.tsx', () => ({
  ViewDetail: () => <div data-testid="view-detail">{useLocation().pathname}</div>,
}));

vi.mock('@/features/auth/LoginPage.tsx', () => ({
  LoginPage: () => <div data-testid="login-page" />,
}));

vi.mock('@/shared/components/spinner.tsx', () => ({ Spinner: () => null }));
vi.mock('@/shared/components/footer.tsx', () => ({ Footer: () => null }));

const VIEW_ID = '11111111-1111-1111-1111-111111111111';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe('App routing', () => {
  it('redirects unknown paths to the WoW landing', () => {
    renderAt('/unknown/deep/path');
    expect(screen.getByTestId('views-page')).toBeInTheDocument();
  });

  it('opens a ladder under its game path', () => {
    renderAt(`/wow/${VIEW_ID}`);
    expect(screen.getByTestId('view-detail')).toHaveTextContent(`/wow/${VIEW_ID}`);
  });

  it('redirects a pre-multi-game ladder link to its WoW path', () => {
    renderAt(`/${VIEW_ID}`);
    expect(screen.getByTestId('view-detail')).toHaveTextContent(`/wow/${VIEW_ID}`);
  });

  it('keeps /login reachable', () => {
    renderAt('/login');
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
