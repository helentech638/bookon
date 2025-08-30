import { authService } from './authService';

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  yearGroup: string;
  allergies: string | null;
  medicalInfo: string | null;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChildRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  yearGroup: string;
  allergies?: string | null;
  medicalInfo?: string | null;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  } | null;
}

export interface UpdateChildRequest extends Partial<CreateChildRequest> {}

class ChildrenService {
  private baseUrl = 'https://bookon55.vercel.app/api/v1/children';

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
      console.error('Children service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getChildren(): Promise<{ success: boolean; data?: Child[]; error?: string }> {
    return this.request<Child[]>('');
  }

  async getChild(id: string): Promise<{ success: boolean; data?: Child; error?: string }> {
    return this.request<Child>(`/${id}`);
  }

  async createChild(childData: CreateChildRequest): Promise<{ success: boolean; data?: Child; error?: string }> {
    return this.request<Child>('', {
      method: 'POST',
      body: JSON.stringify(childData),
    });
  }

  async updateChild(id: string, childData: UpdateChildRequest): Promise<{ success: boolean; data?: Child; error?: string }> {
    return this.request<Child>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(childData),
    });
  }

  async deleteChild(id: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.request(`/${id}`, {
      method: 'DELETE',
    });
    return { success: result.success, error: result.error };
  }
}

export const childrenService = new ChildrenService();
