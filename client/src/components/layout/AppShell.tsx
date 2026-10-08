import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { AmbientBackground } from '@/components/common/AmbientBackground';

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <AmbientBackground />
      <ScrollToTop />
      <Header />
      <main className="flex-1" id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
