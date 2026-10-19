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
const XmlFormatterPage = lazy(() => import('@/pages/XmlFormatterPage').then((m) => ({ default: m.XmlFormatterPage })));
const XmlValidatorPage = lazy(() => import('@/pages/XmlValidatorPage').then((m) => ({ default: m.XmlValidatorPage })));
const XmlToXsdPage = lazy(() => import('@/pages/XmlToXsdPage').then((m) => ({ default: m.XmlToXsdPage })));
const XPathTesterPage = lazy(() => import('@/pages/XPathTesterPage').then((m) => ({ default: m.XPathTesterPage })));
const GroovyTesterPage = lazy(() => import('@/pages/GroovyTesterPage').then((m) => ({ default: m.GroovyTesterPage })));
const XsltGeneratorPage = lazy(() => import('@/pages/XsltGeneratorPage').then((m) => ({ default: m.XsltGeneratorPage })));
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
                path="tools/xml-formatter"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <XmlFormatterPage />
                  </Suspense>
                }
              />
              <Route
                path="tools/xml-validator"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <XmlValidatorPage />
                  </Suspense>
                }
              />
              <Route
                path="tools/xml-to-xsd"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <XmlToXsdPage />
                  </Suspense>
                }
              />
              <Route
                path="tools/xpath-tester"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <XPathTesterPage />
                  </Suspense>
                }
              />
              <Route
                path="tools/groovy-tester"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <GroovyTesterPage />
                  </Suspense>
                }
              />
              <Route
                path="tools/xslt-generator"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <XsltGeneratorPage />
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
            </Route>
            <Route
              path="*"
              element={
                <Suspense fallback={<PageLoader />}>
                  <NotFoundPage />
                </Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </HelmetProvider>
  );
}
