import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, RoleRoute, RootRedirect } from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import { Loader } from './components/ui/Feedback';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import InstallPage from './pages/auth/InstallPage';
import { ForbiddenPage, NotFoundPage } from './pages/StatusPages';
import StoresPage from './pages/client/StoresPage';
import StoreDetailPage from './pages/client/StoreDetailPage';
import MyReservationsPage from './pages/client/MyReservationsPage';

// Manager and Admin screens are loaded on demand (code splitting): customers never download them.
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'));
const ManagerEquipmentPage = lazy(() => import('./pages/manager/ManagerEquipmentPage'));
const ManagerReservationsPage = lazy(() => import('./pages/manager/ManagerReservationsPage'));
const AdminStoresPage = lazy(() => import('./pages/admin/AdminStoresPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminReservationsPage = lazy(() => import('./pages/admin/AdminReservationsPage'));

// Route tree: public -> private (login required) -> role-restricted -> nested pages inside a layout.
export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/install" element={<InstallPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/forbidden" element={<ForbiddenPage />} />

          <Route element={<AppLayout />}>
            <Route element={<RoleRoute roles={['user']} />}>
              <Route path="/client" element={<Navigate to="/client/stores" replace />} />
              <Route path="/client/stores" element={<StoresPage />} />
              <Route path="/client/stores/:storeId" element={<StoreDetailPage />} />
              <Route path="/client/reservations" element={<MyReservationsPage />} />
            </Route>

            <Route element={<RoleRoute roles={['manager']} />}>
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/manager/equipment" element={<ManagerEquipmentPage />} />
              <Route path="/manager/reservations" element={<ManagerReservationsPage />} />
            </Route>

            <Route element={<RoleRoute roles={['admin']} />}>
              <Route path="/admin" element={<Navigate to="/admin/stores" replace />} />
              <Route path="/admin/stores" element={<AdminStoresPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/reservations" element={<AdminReservationsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
