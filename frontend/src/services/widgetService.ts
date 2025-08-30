import { authService } from './authService';

export interface WidgetConfig {
  id: string;
  name: string;
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showLogo: boolean;
  customCSS: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWidgetRequest {
  name: string;
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showLogo: boolean;
  customCSS?: string;
}

export interface UpdateWidgetRequest extends Partial<CreateWidgetRequest> {}

class WidgetService {
  private baseUrl = 'http://localhost:3000/api/v1/widget-config';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Widget service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getWidgets(): Promise<{ success: boolean; data?: WidgetConfig[]; error?: string }> {
    return this.request<WidgetConfig[]>('');
  }

  async getWidget(id: string): Promise<{ success: boolean; data?: WidgetConfig; error?: string }> {
    return this.request<WidgetConfig>(`/${id}`);
  }

  async createWidget(widgetData: CreateWidgetRequest): Promise<{ success: boolean; data?: WidgetConfig; error?: string }> {
    return this.request<WidgetConfig>('', {
      method: 'POST',
      body: JSON.stringify(widgetData),
    });
  }

  async updateWidget(id: string, widgetData: UpdateWidgetRequest): Promise<{ success: boolean; data?: WidgetConfig; error?: string }> {
    return this.request<WidgetConfig>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(widgetData),
    });
  }

  async toggleWidget(id: string): Promise<{ success: boolean; data?: WidgetConfig; error?: string }> {
    return this.request<WidgetConfig>(`/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteWidget(id: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.request(`/${id}`, {
      method: 'DELETE',
    });
    return { success: result.success, error: result.error };
  }

  // Get widget configuration for embedding (public endpoint)
  async getEmbedWidget(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/embed/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Widget embed service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const widgetService = new WidgetService();
