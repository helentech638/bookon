import { buildApiUrl } from '../config/api';
import { authService } from './authService';

export interface NotificationCount {
  unreadCount: number;
  totalCount: number;
}

export interface Notification {
  id: string;
  type: 'booking' | 'cancellation' | 'waitlist' | 'refund';
  title: string;
  created_at: string;
  action_url?: string;
  read: boolean;
}

class NotificationService {
  private baseUrl = buildApiUrl('/notifications');

  /**
   * Get notification count for the current user
   */
  async getNotificationCount(): Promise<NotificationCount> {
    try {
      if (!authService.isAuthenticated()) {
        // Return default values for unauthenticated users
        return { unreadCount: 0, totalCount: 0 };
      }

      const response = await authService.authenticatedFetch(`${this.baseUrl}/count`, {
        method: 'GET',
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch notification count');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching notification count:', error);
      // Return default values on error
      return { unreadCount: 0, totalCount: 0 };
    }
  }

  /**
   * Get notifications for the current user
   */
  async getNotifications(limit: number = 10, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      if (!authService.isAuthenticated()) {
        // Return empty array for unauthenticated users
        return [];
      }

      const params = new URLSearchParams({
        limit: limit.toString(),
        unread: unreadOnly.toString()
      });

      const response = await authService.authenticatedFetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch notifications');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]): Promise<boolean> {
    try {
      if (!authService.isAuthenticated()) {
        // Return false for unauthenticated users
        return false;
      }

      const response = await authService.authenticatedFetch(`${this.baseUrl}/mark-read`, {
        method: 'POST',
        body: JSON.stringify({ notificationIds }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
