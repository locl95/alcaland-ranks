import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from './App';

vi.mock('@/games/wow/components/landing/wow-landing.tsx', () => ({
  WowLanding: () => <div data-testid="wow-landing" />,
}));

vi.mock('@/games/lol/components/landing/lol-landing.tsx', () => ({
  LolLanding: () => <div data-testid="lol-landing" />,
}));

vi.mock('@/games/wow/components/view-detail/wow-view-detail.tsx', () => ({
  WowViewDetail: () => <div data-testid="view-detail">{useLocation().pathname}</div>,
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
    expect(screen.getByTestId('wow-landing')).toBeInTheDocument();
  });

  it('serves the League of Legends landing under /lol', () => {
    renderAt('/lol');
    expect(screen.getByTestId('lol-landing')).toBeInTheDocument();
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
