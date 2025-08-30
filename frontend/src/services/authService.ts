import { toast } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'parent' | 'staff' | 'admin';
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  profileImage?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
  message: string;
}

class AuthService {
  private tokenKey = 'bookon_token';
  private refreshTokenKey = 'bookon_refresh_token';
  private userKey = 'bookon_user';

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Get stored user
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Set authentication data
  setAuth(token: string, refreshToken: string, user: User): void {
    console.log('Setting auth with token:', token ? 'EXISTS' : 'MISSING');
    console.log('Setting auth with refreshToken:', refreshToken ? 'EXISTS' : 'MISSING');
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    console.log('Auth data set. Token key:', this.tokenKey);
    console.log('Stored token:', localStorage.getItem(this.tokenKey));
  }

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    console.log('Checking authentication. Token exists:', !!token);
    console.log('Token key used:', this.tokenKey);
    console.log('All localStorage keys:', Object.keys(localStorage));
    return !!token;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      if (data.success && data.data) {
        // Handle the correct backend response structure
        const accessToken = data.data.tokens?.accessToken || data.data.token;
        const refreshToken = data.data.tokens?.refreshToken || data.data.refreshToken;
        
        if (!accessToken || !refreshToken) {
          throw new Error('Invalid response: missing tokens');
        }
        
        this.setAuth(accessToken, refreshToken, data.data.user);
        toast.success('Login successful!');
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
      toast.success('Logged out successfully');
    }
  }

  // Refresh token
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Token refresh failed');
      }

      if (data.success && data.data) {
        const user = this.getUser();
        if (user) {
          this.setAuth(data.data.token, data.data.refreshToken, user);
          return data.data.token;
        }
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      throw error;
    }
  }

  // Get authenticated user profile
  async getProfile(): Promise<User> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get profile');
      }

      if (data.success && data.data) {
        // Update stored user data
        localStorage.setItem(this.userKey, JSON.stringify(data.data));
        return data.data;
      }

      throw new Error('Failed to get profile');
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update profile');
      }

      if (data.success && data.data) {
        // Update stored user data
        localStorage.setItem(this.userKey, JSON.stringify(data.data));
        toast.success('Profile updated successfully!');
        return data.data;
      }

      throw new Error('Failed to update profile');
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to change password');
      }

      if (data.success) {
        toast.success('Password changed successfully!');
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
      throw error;
    }
  }
}

export const authService = new AuthService();
export default authService;
