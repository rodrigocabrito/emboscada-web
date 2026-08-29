import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/adults" element={<ActivityPacksPage pageKey="adultos" />} />
          <Route path="/kids" element={<ActivityPacksPage pageKey="crianca" />} />
          <Route path="/companies" element={<Empresas />} />
          <Route path="/fields" element={<Campos />} />
          <Route path="/fields/porto" element={<LocationPage slug="porto" />} />
          <Route path="/fields/monsanto" element={<LocationPage slug="monsanto" />} />
          <Route path="/contacts" element={<Contactos />} />
          <Route path="/reservations" element={<Reservas />} />
          <Route path="/faqs" element={<Faqs />} />
          <Route path="/privacy" element={<Privacy />} />
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
