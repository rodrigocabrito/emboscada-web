import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

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
const Availability = lazy(() => import('./pages/Availability'));
const Announcements = lazy(() => import('./pages/Announcements'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

import './styles/global.css';

const RootRedirect = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const AppContent = () => {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <Suspense fallback={<div className="page" style={{ textAlign: 'center', paddingTop: '3rem', color: 'var(--text-muted)' }}>A carregar…</div>}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  );
};

export default App;
