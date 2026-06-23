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

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sessions from './features/sessions/Sessions';
import SessionDetail from './features/sessions/SessionDetail';
import Team from './pages/Team';
import Admin from './features/admin/Admin';
import AdminUsers from './features/admin/AdminUsers';
import AdminCatalogo from './features/admin/AdminCatalogo';
import AdminStock from './features/admin/AdminStock';
import AdminStockBullets from './features/admin/AdminStockBullets';
import AdminSessions from './features/admin/AdminSessions';
import UserEvaluation from './features/admin/UserEvaluation';
import EvaluationView from './features/evaluation/EvaluationView';
import Availability from './pages/Availability';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

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
    </>
  );
};

export default App;
