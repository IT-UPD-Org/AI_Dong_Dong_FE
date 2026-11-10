import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppRouter from './router/AppRouter';
import { PageLoader } from './components/layout/PageLoader';

// Preview controls are available locally only, never in a production build.
const PageLoaderPreview = import.meta.env.DEV
  ? lazy(() => import('./components/layout/PageLoaderPreview'))
  : null;

function AppContent() {
  const { isLoading } = useAuth();
  const location = useLocation();
  // The full-screen brand loader is only for the Landing Page.
  // All other pages render immediately (or show inline skeletons) without blocking.
  const isLandingPage = location.pathname === '/';
  const [showLoader, setShowLoader] = useState(isLandingPage);
  const loaderVisible = isLandingPage && (isLoading || showLoader);

  useEffect(() => {
    if (isLandingPage && isLoading) setShowLoader(true);
  }, [isLoading, isLandingPage]);

  // Same tree on every route so navigating to or from "/" never remounts the app;
  // the overlay only ever appears on the landing page.
  return (
    <>
      <div inert={loaderVisible} aria-busy={loaderVisible}>
        <AppRouter />
      </div>
      {loaderVisible && (
        <PageLoader loading={isLoading} onComplete={() => setShowLoader(false)} />
      )}
    </>
  );
}

export default function App() {
  if (PageLoaderPreview && new URLSearchParams(window.location.search).get('preview') === 'page-loader') {
    return (
      <Suspense fallback={null}>
        <PageLoaderPreview />
      </Suspense>
    );
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
