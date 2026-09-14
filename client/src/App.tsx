import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingState } from '@/components/common/LoadingState';

// Lazy-load pages for code splitting
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const LearningHubPage = lazy(() => import('@/pages/LearningHubPage').then((m) => ({ default: m.LearningHubPage })));
const ToolsPage = lazy(() => import('@/pages/ToolsPage').then((m) => ({ default: m.ToolsPage })));
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function PageLoader() {
  return <LoadingState message="Loading page..." />;
}

export function App() {
  return (
    <HelmetProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route
                index
                element={
                  <Suspense fallback={<PageLoader />}>
                    <HomePage />
                  </Suspense>
                }
              />
              <Route
                path="learning"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <LearningHubPage />
                  </Suspense>
                }
              />
              <Route
                path="learning/integration-development"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <LearningHubPage />
                  </Suspense>
                }
              />
              <Route
                path="tools"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ToolsPage />
                  </Suspense>
                }
              />
              <Route
                path="about"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AboutPage />
                  </Suspense>
                }
              />
              <Route
                path="*"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <NotFoundPage />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </HelmetProvider>
  );
}
