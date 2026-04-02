import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { PortalLayout } from './components/PortalLayout'
import { useAuthStore } from './store/authStore'

import Login from './pages/Login'
import AcceptInvite from './pages/AcceptInvite'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import Drivers from './pages/Drivers'
import DriverDetail from './pages/DriverDetail'
import Vehicles from './pages/Vehicles'
import VehicleDetail from './pages/VehicleDetail'
import Trips from './pages/Trips'
import Finance from './pages/Finance'
import Advances from './pages/Advances'
import HrRequests from './pages/HrRequests'
import Invoices from './pages/Invoices'
import Settings from './pages/Settings'
import AuditLog from './pages/AuditLog'
import Reports from './pages/Reports'

import PortalHome from './pages/portal/Home'
import MyTrips from './pages/portal/MyTrips'
import MyEarnings from './pages/portal/MyEarnings'
import MyAdvances from './pages/portal/MyAdvances'
import MyLeave from './pages/portal/MyLeave'

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
  return <Dashboard />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
                    <Route path="*" element={<Navigate to="/portal" replace />} />
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
                    <Route path="/drivers" element={<Drivers />} />
                    <Route path="/drivers/:id" element={<DriverDetail />} />
                    <Route path="/vehicles" element={<Vehicles />} />
                    <Route path="/vehicles/:id" element={<VehicleDetail />} />
                    <Route path="/trips" element={<Trips />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/advances" element={<Advances />} />
                    <Route path="/hr" element={<HrRequests />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
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
