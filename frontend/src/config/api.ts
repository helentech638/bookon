// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://bookon-lcxdpibbd-educationxploreofficial-gmailcoms-projects.vercel.app/api/v1',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
    },
    DASHBOARD: {
      STATS: '/dashboard/stats',
      PROFILE: '/dashboard/profile',
      RECENT_ACTIVITIES: '/dashboard/recent-activities',
    },
    ADMIN: {
      STATS: '/admin/stats',
      VENUES: '/admin/venues',
      ACTIVITIES: '/admin/activities',
      RECENT_BOOKINGS: '/admin/recent-bookings',
      USERS: '/admin/users',
      SYSTEM_CONFIG: '/admin/system-config',
      AUDIT_LOGS: '/admin/audit-logs',
      BULK_USER_UPDATE: '/admin/bulk-user-update',
      BOOKINGS: '/admin/bookings',
      EMAIL_TEMPLATES: '/admin/email-templates',
      BROADCAST_MESSAGE: '/admin/broadcast-message',
      EXPORT_HISTORY: '/admin/export/history',
      EXPORT: '/admin/export',
      EXPORT_SCHEDULE: '/admin/export/schedule',
      FINANCIAL_REPORTS: '/admin/financial-reports',
      NOTIFICATIONS: '/admin/notifications',
      PAYMENT_SETTINGS: '/admin/payment-settings',
      VENUE_PAYMENT_ACCOUNTS: '/admin/venue-payment-accounts',
    },
    VENUES: '/venues',
    ACTIVITIES: '/activities',
    CHILDREN: '/children',
    BOOKINGS: '/bookings',
    REGISTERS: '/registers',
    PAYMENTS: '/payments',
    NOTIFICATIONS: '/notifications',
  },
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to build full API URLs with parameters
export const buildApiUrlWithParams = (endpoint: string, params: Record<string, string>): string => {
  const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
};
