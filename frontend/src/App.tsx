import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Components
import { AuthErrorBoundary } from './components/AuthErrorBoundary';

// Utils
import { clearAllAuthData } from './utils/authUtils';

// Layout components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import RoleBasedProtectedRoute from './components/Auth/RoleBasedProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import BusinessDashboard from './pages/Business/BusinessDashboard';
import BusinessActivitiesPage from './pages/Business/ActivitiesPage';
import BusinessCreateActivityPage from './pages/Business/CreateActivityPage';
import BusinessFinancePage from './pages/Business/FinancePage';
import BusinessTemplatesPage from './pages/Business/TemplatesPage';
import BusinessVenuesPage from './pages/Business/VenuesPage';
import BusinessCommunicationsPage from './pages/Business/CommunicationsPage';
import BusinessCommunicationsAutomatedPage from './pages/Business/CommunicationsAutomatedPage';
import BusinessCommunicationsBroadcastsPage from './pages/Business/CommunicationsBroadcastsPage';
import BusinessCommunicationsLogsPage from './pages/Business/CommunicationsLogsPage';
import BusinessRegistersPage from './pages/Business/RegistersPage';
import BusinessRegisterSetupPage from './pages/Business/RegisterSetupPage';
import BusinessVenueSetupPage from './pages/Business/VenueSetupPage';
import BusinessWidgetManagementPage from './pages/Business/WidgetManagementPage';
import BusinessNotificationsPage from './pages/Business/NotificationsPage';
import BusinessUsersPage from './pages/Business/UsersPage';
import BusinessSettingsPage from './pages/Business/SettingsPage';
import DashboardRouter from './components/DashboardRouter';
import ActivitiesPage from './pages/Activities/ActivitiesPage';
import BookingsPage from './pages/Bookings/BookingsPage';
import BookingDetailPage from './pages/Bookings/BookingDetailPage';
import BookingEditPage from './pages/Bookings/BookingEditPage';
import ParentBookingFlow from './pages/Bookings/ParentBookingFlow';
import ChildrenPage from './pages/Parent/ChildrenPage';
import ProfilePage from './pages/Profile/ProfilePage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import TemplatesPage from './pages/Admin/TemplatesPage';
import CoursesPage from './pages/Admin/CoursesPage';
import VenueSetupPage from './pages/Admin/VenueSetupPage';
import FranchiseFeeSettings from './pages/Admin/FranchiseFeeSettings';
import FinanceReporting from './pages/Admin/FinanceReporting';
import VenueForm from './pages/Admin/VenueForm';
import ActivityForm from './pages/Admin/ActivityForm';
import BookingManagement from './pages/Admin/BookingManagement';
import UserManagement from './pages/Admin/UserManagement';
import FinancialDashboard from './pages/Admin/FinancialDashboard';
import EmailTemplates from './pages/Admin/EmailTemplates';
import BroadcastMessaging from './pages/Admin/BroadcastMessaging';
import NotificationCenter from './pages/Admin/NotificationCenter';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import CommunicationsPage from './pages/Admin/CommunicationsPage';
import FinancePage from './pages/Admin/FinancePage';
import AdminCreateActivityPage from './pages/Admin/CreateActivityPage';
import ActivityTypesPage from './pages/Admin/ActivityTypesPage';
import RegisterManagementPage from './pages/Admin/RegisterManagementPage';
import TFCPendingQueuePage from './pages/Admin/TFCPendingQueuePage';
import PendingPaymentPage from './pages/PendingPaymentPage';
import AdvancedAdminTools from './pages/Admin/AdvancedAdminTools';
import RegisterManagement from './pages/Admin/RegisterManagement';
import WidgetManagement from './pages/Admin/WidgetManagement';
import PaymentSettings from './pages/Admin/PaymentSettings';
import ExportCenter from './pages/Admin/ExportCenter';
import TFCQueuePage from './pages/Admin/TFCQueuePage';
import ProviderSettingsPage from './pages/Admin/ProviderSettingsPage';
import AdminSettings from './pages/Admin/AdminSettings';
import WebhookManagement from './pages/Admin/WebhookManagement';
import BankFeedManagement from './pages/Admin/BankFeedManagement';
import VenuesPage from './pages/Venues/VenuesPage';
import VenueDetailPage from './pages/Venues/VenueDetailPage';
import MyBookingsPage from './pages/Parent/MyBookingsPage';
import WalletPage from './pages/Parent/WalletPage';
import NotFoundPage from './pages/NotFoundPage';
import WidgetPage from './pages/WidgetPage';
import ActivityConfirmationPage from './pages/Activities/ActivityConfirmationPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import ChildPermissionsPage from './pages/Children/ChildPermissionsPage';
import AddChildPage from './pages/Children/AddChildPage';
import PaymentSuccessPage from './pages/Payment/PaymentSuccessPage';
import PaymentPage from './pages/Payment/PaymentPage';

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
              <DashboardRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/dashboard"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessDashboard />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/activities"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessActivitiesPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/activities/new"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessCreateActivityPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/finance"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessFinancePage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/finance/transactions"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessFinancePage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/finance/discounts"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessFinancePage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/finance/credits"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessFinancePage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/finance/refunds"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessFinancePage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/finance/reports"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessFinancePage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/templates"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessTemplatesPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/venues"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessVenuesPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/communications"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessCommunicationsPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/communications/automated"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessCommunicationsAutomatedPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/communications/broadcasts"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessCommunicationsBroadcastsPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/communications/logs"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessCommunicationsLogsPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/registers"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessRegistersPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/register-setup"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business', 'admin']}>
              <BusinessRegisterSetupPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/venue-setup"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business', 'admin']}>
              <BusinessVenueSetupPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/widgets"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business', 'admin']}>
              <BusinessWidgetManagementPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/widgets/config"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business', 'admin']}>
              <BusinessWidgetManagementPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/widgets/analytics"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business', 'admin']}>
              <BusinessWidgetManagementPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/widgets/embed"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business', 'admin']}>
              <BusinessWidgetManagementPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/notifications"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessNotificationsPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/notifications/settings"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessNotificationsPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/notifications/templates"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessNotificationsPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/notifications/logs"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessNotificationsPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/users"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessUsersPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/business/settings"
          element={
            <RoleBasedProtectedRoute allowedRoles={['business']}>
              <BusinessSettingsPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/parent/dashboard"
          element={
            <RoleBasedProtectedRoute allowedRoles={['parent', 'staff', 'admin']}>
              <DashboardPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/activities"
          element={
            <RoleBasedProtectedRoute allowedRoles={['parent', 'staff', 'admin']}>
              <ActivitiesPage />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/activities/:activityId/confirm"
          element={
            <ProtectedRoute>
              <ActivityConfirmationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/:activityId"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-success/:bookingId"
          element={
            <ProtectedRoute>
              <PaymentSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/venues"
          element={
            <RoleBasedProtectedRoute allowedRoles={['parent', 'staff', 'admin']}>
              <VenuesPage />
            </RoleBasedProtectedRoute>
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
          path="/bookings/flow/:activityId"
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
          path="/children/new"
          element={
            <ProtectedRoute>
              <AddChildPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/children/:childId/permissions"
          element={
            <ProtectedRoute>
              <ChildPermissionsPage />
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
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <RoleBasedProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/admin/templates"
          element={
            <ProtectedRoute>
              <TemplatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute>
              <CoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/venue-setup"
          element={
            <ProtectedRoute>
              <VenueSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/franchise-fee-settings"
          element={
            <ProtectedRoute>
              <FranchiseFeeSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/finance-reporting"
          element={
            <ProtectedRoute>
              <FinanceReporting />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/venues"
          element={
            <RoleBasedProtectedRoute allowedRoles={['admin']}>
              <VenuesPage />
            </RoleBasedProtectedRoute>
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
          path="/admin/communications"
          element={
            <ProtectedRoute>
              <CommunicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/finance"
          element={
            <ProtectedRoute>
              <FinancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-activity"
          element={
            <ProtectedRoute>
              <AdminCreateActivityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activity-types"
          element={
            <ProtectedRoute>
              <ActivityTypesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/register-management"
          element={
            <ProtectedRoute>
              <RegisterManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tfc-pending-queue"
          element={
            <ProtectedRoute>
              <TFCPendingQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pending-payment/:bookingId"
          element={
            <ProtectedRoute>
              <PendingPaymentPage />
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
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute>
              <FinancialDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/wallet-management"
          element={
            <ProtectedRoute>
              <WalletPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/webhooks"
          element={
            <ProtectedRoute>
              <WebhookManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bank-feed"
          element={
            <RoleBasedProtectedRoute allowedRoles={['admin']}>
              <BankFeedManagement />
            </RoleBasedProtectedRoute>
          }
        />
        <Route
          path="/admin/communications"
          element={
            <ProtectedRoute>
              <BroadcastMessaging />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute>
              <AdvancedAdminTools />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/data-retention"
          element={
            <ProtectedRoute>
              <AdvancedAdminTools />
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
  // Global auth check on app load
  React.useEffect(() => {
    const checkGlobalAuth = async () => {
      const token = localStorage.getItem('bookon_token');
      if (token) {
        try {
          const response = await fetch('https://bookon-api.vercel.app/api/verify-token', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            console.log('Global auth check failed, clearing auth data');
            clearAllAuthData();
          }
        } catch (error) {
          console.log('Global auth check error, clearing auth data');
          clearAllAuthData();
        }
      }
    };
    
    checkGlobalAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <AuthErrorBoundary>
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
          </AuthErrorBoundary>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
