import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// Route-level code splitting: each page loads on demand instead of shipping
// one monolithic bundle (admin pages especially are rarely needed by monitors).
const Login = lazy(() => import('./pages/Login'));
// Public marketing site
const PublicLayout = lazy(() => import('./features/public/PublicLayout'));
const Home = lazy(() => import('./features/public/pages/Home'));
const ActivityPacksPage = lazy(() => import('./features/public/pages/ActivityPacksPage'));
const Empresas = lazy(() => import('./features/public/pages/Empresas'));
const Campos = lazy(() => import('./features/public/pages/Campos'));
const LocationPage = lazy(() => import('./features/public/pages/LocationPage'));
const Contactos = lazy(() => import('./features/public/pages/Contactos'));
const Reservas = lazy(() => import('./features/public/pages/Reservas'));
const Faqs = lazy(() => import('./features/public/pages/Faqs'));
const Privacy = lazy(() => import('./features/public/pages/Privacy'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Sessions = lazy(() => import('./features/sessions/Sessions'));
const SessionDetail = lazy(() => import('./features/sessions/SessionDetail'));
const Team = lazy(() => import('./pages/Team'));
const Admin = lazy(() => import('./features/admin/Admin'));
const AdminUsers = lazy(() => import('./features/admin/AdminUsers'));
const AdminCatalogo = lazy(() => import('./features/admin/AdminCatalogo'));
const AdminStock = lazy(() => import('./features/admin/AdminStock'));
const AdminStockBullets = lazy(() => import('./features/admin/AdminStockBullets'));
const AdminSessions = lazy(() => import('./features/admin/AdminSessions'));
const AdminSchedule = lazy(() => import('./features/admin/AdminSchedule'));
const UserEvaluation = lazy(() => import('./features/admin/UserEvaluation'));
const EvaluationView = lazy(() => import('./features/evaluation/EvaluationView'));
const EarningsView = lazy(() => import('./features/earnings/EarningsView'));
const Availability = lazy(() => import('./pages/Availability'));
const Announcements = lazy(() => import('./pages/Announcements'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

import './styles/global.css';
import './styles/public.css';

// Public marketing routes, defined once and rendered twice: at the root (PT,
// unprefixed) and again under /:lang for English/French/Spanish (#9).
const publicRoutes = [
  { index: true, element: <Home /> },
  { path: 'adults', element: <ActivityPacksPage pageKey="adultos" /> },
  { path: 'kids', element: <ActivityPacksPage pageKey="crianca" /> },
  { path: 'companies', element: <Empresas /> },
  { path: 'fields', element: <Campos /> },
  { path: 'fields/porto', element: <LocationPage slug="porto" /> },
  { path: 'fields/monsanto', element: <LocationPage slug="monsanto" /> },
  { path: 'contacts', element: <Contactos /> },
  { path: 'reservations', element: <Reservas /> },
  { path: 'faqs', element: <Faqs /> },
  { path: 'privacy', element: <Privacy /> },
];
const renderPublicRoutes = () =>
  publicRoutes.map((r, i) =>
    r.index
      ? <Route key={i} index element={r.element} />
      : <Route key={i} path={r.path} element={r.element} />,
  );

// Guards the /:lang subtree: only en/fr/es are valid prefixes; anything else is
// a real 404 (so /random doesn't silently render the home page as "language").
const PUBLIC_LOCALES = ['pt', 'en', 'fr', 'es'];
const LangGuard = () => {
  const { lang } = useParams();
  return PUBLIC_LOCALES.includes(lang) ? <Outlet /> : <NotFound />;
};

// The hidden staff login. Reachable only by typing /portal — no public link
// points here. If already signed in, skip straight to the dashboard.
const PortalGate = () => {
  const { user, profile } = useAuth();
  if (user && profile?.role) return <Navigate to="/home" replace />;
  return <Login />;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Reset scroll to the top on every route change (but not on in-page #anchor
// jumps, which only change the hash — pathname stays the same).
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const AppContent = () => {
  return (
    <Suspense fallback={<div className="page" style={{ textAlign: 'center', paddingTop: '3rem', color: 'var(--text-muted)' }}>A carregar…</div>}>
      <ScrollToTop />
      <Routes>
        {/* ── Public marketing site (open to everyone, no staff nav) ── */}
        {/* Bare root → default language */}
        <Route path="/" element={<Navigate to="/pt" replace />} />
        <Route element={<PublicLayout />}>
          {/* Every language is prefixed: /pt, /en, /fr, /es */}
          <Route path=":lang" element={<LangGuard />}>
            {renderPublicRoutes()}
          </Route>
        </Route>

        {/* ── Hidden staff portal login ── */}
        <Route path="/portal" element={<PortalGate />} />

        {/* ── Staff app (authenticated) — Navbar lives in AppLayout ── */}
        <Route element={<AppLayout />}>
        <Route
          path="/sessions"
          element={
            <ProtectedRoute>
              <Sessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions/:id"
          element={
            <ProtectedRoute>
              <SessionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <Team />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-evaluation"
          element={
            <ProtectedRoute>
              <EvaluationView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/earnings"
          element={
            <ProtectedRoute>
              <EarningsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <ProtectedRoute>
              <Availability />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sessions"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminSessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:id/evaluate"
          element={
            <ProtectedRoute adminOnly={true}>
              <UserEvaluation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:id/earnings"
          element={
            <ProtectedRoute adminOnly={true}>
              <EarningsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/catalog"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminCatalogo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/schedule"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stock"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminStock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stock/bullets"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminStockBullets />
            </ProtectedRoute>
          }
        />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default App;
