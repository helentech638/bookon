import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Layout components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ActivitiesPage from './pages/Activities/ActivitiesPage';
import BookingsPage from './pages/Bookings/BookingsPage';
import BookingDetailPage from './pages/Bookings/BookingDetailPage';
import BookingEditPage from './pages/Bookings/BookingEditPage';
import ParentBookingFlow from './pages/Bookings/ParentBookingFlow';
import ChildrenPage from './pages/Parent/ChildrenPage';
import ProfilePage from './pages/Profile/ProfilePage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import VenueForm from './pages/Admin/VenueForm';
import ActivityForm from './pages/Admin/ActivityForm';
import BookingManagement from './pages/Admin/BookingManagement';
import UserManagement from './pages/Admin/UserManagement';
import FinancialDashboard from './pages/Admin/FinancialDashboard';
import EmailTemplates from './pages/Admin/EmailTemplates';
import BroadcastMessaging from './pages/Admin/BroadcastMessaging';
import NotificationCenter from './pages/Admin/NotificationCenter';
import AdvancedAdminTools from './pages/Admin/AdvancedAdminTools';
import RegisterManagement from './pages/Admin/RegisterManagement';
import WidgetManagement from './pages/Admin/WidgetManagement';
import PaymentSettings from './pages/Admin/PaymentSettings';
import ExportCenter from './pages/Admin/ExportCenter';
import TFCQueuePage from './pages/Admin/TFCQueuePage';
import ProviderSettingsPage from './pages/Admin/ProviderSettingsPage';
import VenuesPage from './pages/Venues/VenuesPage';
import VenueDetailPage from './pages/Venues/VenueDetailPage';
import MyBookingsPage from './pages/Parent/MyBookingsPage';
import WalletPage from './pages/Parent/WalletPage';
import PendingPaymentPage from './pages/PendingPaymentPage';
import NotFoundPage from './pages/NotFoundPage';
import WidgetPage from './pages/WidgetPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppRoutes() {
  const { user, logout } = useAuth();

  return (
    <Layout user={user} onLogout={logout}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/widget" element={<WidgetPage />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities"
          element={
            <ProtectedRoute>
              <ActivitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/venues"
          element={
            <ProtectedRoute>
              <VenuesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/venues/:id"
          element={
            <ProtectedRoute>
              <VenueDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:id"
          element={
            <ProtectedRoute>
              <BookingDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:id/edit"
          element={
            <ProtectedRoute>
              <BookingEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/flow"
          element={
            <ProtectedRoute>
              <ParentBookingFlow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/children"
          element={
            <ProtectedRoute>
              <ChildrenPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <WalletPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pending-payment/:id"
          element={
            <ProtectedRoute>
              <PendingPaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        
        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/venues"
          element={
            <ProtectedRoute>
              <VenuesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/venues/new"
          element={
            <ProtectedRoute>
              <VenueForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/venues/:id/edit"
          element={
            <ProtectedRoute>
              <VenueForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activities"
          element={
            <ProtectedRoute>
              <ActivitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activities/new"
          element={
            <ProtectedRoute>
              <ActivityForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activities/:id/edit"
          element={
            <ProtectedRoute>
              <ActivityForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute>
              <BookingManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/financial"
          element={
            <ProtectedRoute>
              <FinancialDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/email-templates"
          element={
            <ProtectedRoute>
              <EmailTemplates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/broadcast"
          element={
            <ProtectedRoute>
              <BroadcastMessaging />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute>
              <NotificationCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/advanced-tools"
          element={
            <ProtectedRoute>
              <AdvancedAdminTools />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/registers"
          element={
            <ProtectedRoute>
              <RegisterManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/widget"
          element={
            <ProtectedRoute>
              <WidgetManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payment-settings"
          element={
            <ProtectedRoute>
              <PaymentSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/export"
          element={
            <ProtectedRoute>
              <ExportCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tfc-queue"
          element={
            <ProtectedRoute>
              <TFCQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/provider-settings"
          element={
            <ProtectedRoute>
              <ProviderSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="App">
              <AppRoutes />
              
              {/* Global toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
