import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from './components/ui/Toast'

import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { PortalLayout } from './components/PortalLayout'
import { useAuthStore } from './store/authStore'

import Login from './pages/Login'
import AcceptInvite from './pages/AcceptInvite'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import UserDetail from './pages/UserDetail'
import Drivers from './pages/Drivers'
import Owners from './pages/Owners'
import DriverDetail from './pages/DriverDetail'
import Vehicles from './pages/Vehicles'
import VehicleDetail from './pages/VehicleDetail'
import Trips from './pages/Trips'
import Finance from './pages/Finance'
import Advances from './pages/Advances'
import HrRequests from './pages/HrRequests'
import Invoices from './pages/Invoices'
import Settings from './pages/Settings'
import ChangePassword from './pages/ChangePassword'
import AuditLog from './pages/AuditLog'
import Reports from './pages/Reports'
import SalaryPage from './pages/Salary'
import Broadcasts from './pages/Broadcasts'

import PortalHome from './pages/portal/Home'
import OwnerHome from './pages/portal/OwnerHome'
import MyTrips from './pages/portal/MyTrips'
import MyEarnings from './pages/portal/MyEarnings'
import MyAdvances from './pages/portal/MyAdvances'
import MyLeave from './pages/portal/MyLeave'
import MyProfile from './pages/portal/MyProfile'
import MyCash from './pages/portal/MyCash'
import MySalarySlips from './pages/portal/MySalarySlips'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

/** Redirects drivers to /portal; leaves non-drivers on the admin layout. */
function RootRedirect() {
  const { user } = useAuthStore()
  if (user?.role === 'driver') return <Navigate to="/portal" replace />
  if (user?.role === 'owner') return <Navigate to="/owner-portal" replace />
  return <Dashboard />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Driver portal — isolated layout */}
          <Route
            path="/portal/*"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <PortalLayout>
                  <Routes>
                    <Route path="/" element={<PortalHome />} />
                    <Route path="/trips" element={<MyTrips />} />
                    <Route path="/earnings" element={<MyEarnings />} />
                    <Route path="/advances" element={<MyAdvances />} />
                    <Route path="/leave" element={<MyLeave />} />
                    <Route path="/profile" element={<MyProfile />} />
                    <Route path="/cash" element={<MyCash />} />
                    <Route path="/slips" element={<MySalarySlips />} />
                    <Route path="*" element={<Navigate to="/portal" replace />} />
                  </Routes>
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          {/* Owner portal — isolated layout */}
          <Route
            path="/owner-portal/*"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <PortalLayout>
                  <Routes>
                    <Route path="/" element={<OwnerHome />} />
                    <Route path="*" element={<Navigate to="/owner-portal" replace />} />
                  </Routes>
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/users/:id"
                      element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                          <UserDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/drivers" element={<Drivers />} />
                    <Route path="/drivers/:id" element={<DriverDetail />} />
                    <Route
                      path="/owners"
                      element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                          <Owners />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/vehicles" element={<Vehicles />} />
                    <Route path="/vehicles/:id" element={<VehicleDetail />} />
                    <Route path="/trips" element={<Trips />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/advances" element={<Advances />} />
                    <Route path="/hr" element={<HrRequests />} />
                    <Route path="/salary" element={<SalaryPage />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route
                      path="/broadcasts"
                      element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                          <Broadcasts />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/change-password" element={<ChangePassword />} />
                    <Route
                      path="/audit"
                      element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                          <AuditLog />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
