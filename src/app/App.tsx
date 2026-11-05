import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from '@/shared/components/spinner.tsx';
import { Footer } from '@/shared/components/footer.tsx';
import { WowLanding } from '@/games/wow/wow-landing.tsx';
import { LolLanding } from '@/games/lol/lol-landing.tsx';
import { LolViewDetail } from '@/games/lol/view-detail/lol-view-detail.tsx';
import { ViewDetail } from '@/features/views/components/view-detail/view-detail.tsx';
import { LoginPage } from '@/features/auth/LoginPage.tsx';
import { GameLayout } from '@/shared/game/game-layout.tsx';
import { LegacyViewRedirect } from './legacy-view-redirect.tsx';
import './App.css';

export function App() {
  return (
    <div className="app-layout">
      <Spinner />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/wow" replace />} />
          <Route path="/wow" element={<GameLayout key="wow" game="wow" />}>
            <Route index element={<WowLanding />} />
            <Route path=":viewId" element={<ViewDetail />} />
          </Route>
          <Route path="/lol" element={<GameLayout key="lol" game="lol" />}>
            <Route index element={<LolLanding />} />
            <Route path=":viewId" element={<LolViewDetail />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/:viewId" element={<LegacyViewRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
