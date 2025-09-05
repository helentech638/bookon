import { api } from '../config/api';

export interface Booking {
  id: number;
  bookingNumber: string;
  childName: string;
  activity: string;
  venue: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  amount: number;
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'failed';
  createdAt: string;
  notes?: string;
}

export interface CreateBookingData {
  childId: number;
  activityId: number;
  venueId: number;
  date: string;
  time: string;
  notes?: string;
}

export interface UpdateBookingData {
  date?: string;
  time?: string;
  notes?: string;
}

class BookingService {
  // Get all bookings for the current user
  async getBookings(): Promise<Booking[]> {
    try {
      const response = await api.get('/bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  // Get a specific booking by ID
  async getBooking(id: number): Promise<Booking> {
    try {
      const response = await api.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  }

  // Create a new booking
  async createBooking(data: CreateBookingData): Promise<Booking> {
    try {
      const response = await api.post('/bookings', data);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  // Update a booking
  async updateBooking(id: number, data: UpdateBookingData): Promise<Booking> {
    try {
      const response = await api.put(`/bookings/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  }

  // Confirm a pending booking
  async confirmBooking(id: number): Promise<Booking> {
    try {
      const response = await api.patch(`/bookings/${id}/confirm`);
      return response.data;
    } catch (error) {
      console.error('Error confirming booking:', error);
      throw error;
    }
  }

  // Cancel a confirmed booking
  async cancelBooking(id: number): Promise<Booking> {
    try {
      const response = await api.patch(`/bookings/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  // Delete a booking
  async deleteBooking(id: number): Promise<void> {
    try {
      await api.delete(`/bookings/${id}`);
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  }

  // Get bookings by status
  async getBookingsByStatus(status: string): Promise<Booking[]> {
    try {
      const response = await api.get(`/bookings?status=${status}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings by status:', error);
      throw error;
    }
  }

  // Get bookings by venue
  async getBookingsByVenue(venueId: number): Promise<Booking[]> {
    try {
      const response = await api.get(`/bookings?venueId=${venueId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings by venue:', error);
      throw error;
    }
  }

  // Search bookings
  async searchBookings(query: string): Promise<Booking[]> {
    try {
      const response = await api.get(`/bookings/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching bookings:', error);
      throw error;
    }
  }
}

export const bookingService = new BookingService();
