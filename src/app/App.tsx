import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from '@/shared/components/spinner.tsx';
import { Footer } from '@/shared/components/footer.tsx';
import { ViewsPage } from '@/features/views/components/views-page/views-page.tsx';
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
          <Route path="/wow" element={<GameLayout game="wow" />}>
            <Route index element={<ViewsPage />} />
            <Route path=":viewId" element={<ViewDetail />} />
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
