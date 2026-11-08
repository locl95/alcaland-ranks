import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { GameLayout } from './game-layout.tsx';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/wow-forever" element={<GameLayout game="wow-forever" />}>
          <Route index element={null} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('GameLayout', () => {
  it('marks <html> with the active game so its theme applies', () => {
    renderAt('/wow-forever');
    expect(document.documentElement.dataset.game).toBe('wow-forever');
  });

  it('clears the mark on unmount, so pages outside a game get the default theme', () => {
    const { unmount } = renderAt('/wow-forever');
    unmount();
    expect(document.documentElement.dataset.game).toBeUndefined();
  });
});
