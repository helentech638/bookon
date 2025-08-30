import { db } from '../utils/database';
import { Booking, CreateBookingRequest, UpdateBookingRequest, BookingWithDetails } from '../types';
import { logger } from '../utils/logger';
import { ActivityModel } from './Activity';
import { AppError } from '../middleware/errorHandler';

export class BookingModel {
  private static readonly TABLE_NAME = 'bookings';

  /**
   * Create a new booking
   */
  static async create(
    bookingData: CreateBookingRequest,
    parentId: string
  ): Promise<Booking> {
    try {
      // Validate activity exists and is active
      const activity = await ActivityModel.findById(bookingData.activityId);
      if (!activity) {
        throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
      }

      if (!activity.isActive) {
        throw new AppError('Activity is not active', 400, 'ACTIVITY_INACTIVE');
      }

      // Check if activity is in the future
      if (new Date(activity.startDate) <= new Date()) {
        throw new AppError('Cannot book past activities', 400, 'ACTIVITY_IN_PAST');
      }

      // Check availability
      const availability = await ActivityModel.checkAvailability(bookingData.activityId);
      if (!availability.available) {
        throw new AppError('Activity is fully booked', 400, 'ACTIVITY_FULLY_BOOKED');
      }

      // Check if child exists and belongs to parent
      const child = await db('children')
        .where({ id: bookingData.childId, parentId, isActive: true })
        .first();

      if (!child) {
        throw new AppError('Child not found or does not belong to parent', 404, 'CHILD_NOT_FOUND');
      }

      // Check if child is already booked for this activity
      const existingBooking = await db(this.TABLE_NAME)
        .where({
          activityId: bookingData.activityId,
          childId: bookingData.childId,
          status: 'confirmed',
        })
        .first();

      if (existingBooking) {
        throw new AppError('Child is already booked for this activity', 400, 'DUPLICATE_BOOKING');
      }

      // Check age restrictions
      if (activity.ageMin || activity.ageMax) {
        const childAge = this.calculateAge(child.dateOfBirth);
        if (activity.ageMin && childAge < activity.ageMin) {
          throw new AppError(`Child must be at least ${activity.ageMin} years old`, 400, 'AGE_RESTRICTION');
        }
        if (activity.ageMax && childAge > activity.ageMax) {
          throw new AppError(`Child must be no more than ${activity.ageMax} years old`, 400, 'AGE_RESTRICTION');
        }
      }

      // Create booking in transaction
      const result = await db.transaction(async (trx) => {
        // Create the booking
        const [booking] = await trx(this.TABLE_NAME)
          .insert({
            ...bookingData,
            parentId,
            status: 'pending',
            totalAmount: activity.price,
            paymentStatus: 'pending',
            bookedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning('*');

        // Update activity booking count
        await ActivityModel.updateBookingCount(bookingData.activityId, true);

        return booking;
      });

      logger.info(`Booking created: ${result.id} for activity ${bookingData.activityId}`);
      return result;
    } catch (error) {
      logger.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Find booking by ID
   */
  static async findById(id: string): Promise<Booking | null> {
    try {
      const booking = await db(this.TABLE_NAME)
        .where({ id })
        .first();

      return booking || null;
    } catch (error) {
      logger.error('Error finding booking by ID:', error);
      throw error;
    }
  }

  /**
   * Find booking by ID with full details
   */
  static async findByIdWithDetails(id: string): Promise<BookingWithDetails | null> {
    try {
      const booking = await db(this.TABLE_NAME)
        .select(
          'bookings.*',
          'activities.name as activityName',
          'activities.startDate as activityStartDate',
          'activities.endDate as activityEndDate',
          'activities.startTime as activityStartTime',
          'activities.endTime as activityEndTime',
          'activities.price as activityPrice',
          'children.firstName as childFirstName',
          'children.lastName as childLastName',
          'children.dateOfBirth as childDateOfBirth',
          'users.email as parentEmail',
          'venues.name as venueName',
          'venues.address as venueAddress'
        )
        .join('activities', 'bookings.activityId', 'activities.id')
        .join('children', 'bookings.childId', 'children.id')
        .join('users', 'bookings.parentId', 'users.id')
        .join('venues', 'activities.venueId', 'venues.id')
        .where({ 'bookings.id': id })
        .first();

      if (!booking) return null;

      return {
        ...booking,
        activity: {
          id: booking.activityId,
          name: booking.activityName,
          startDate: booking.activityStartDate,
          endDate: booking.activityEndDate,
          startTime: booking.activityStartTime,
          endTime: booking.activityEndTime,
          price: booking.activityPrice,
        },
        child: {
          id: booking.childId,
          firstName: booking.childFirstName,
          lastName: booking.childLastName,
          dateOfBirth: booking.childDateOfBirth,
        },
        parent: {
          id: booking.parentId,
          email: booking.parentEmail,
        },
        venue: {
          name: booking.venueName,
          address: booking.venueAddress,
        },
      };
    } catch (error) {
      logger.error('Error finding booking with details:', error);
      throw error;
    }
  }

  /**
   * Get all bookings for a parent
   */
  static async findByParent(
    parentId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      status?: string;
      activityId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<{ bookings: BookingWithDetails[], total: number }> {
    try {
      let query = db(this.TABLE_NAME)
        .select(
          'bookings.*',
          'activities.name as activityName',
          'activities.startDate as activityStartDate',
          'activities.endDate as activityEndDate',
          'activities.startTime as activityStartTime',
          'activities.endTime as activityEndTime',
          'activities.price as activityPrice',
          'children.firstName as childFirstName',
          'children.lastName as childLastName',
          'children.dateOfBirth as childDateOfBirth',
          'users.email as parentEmail',
          'venues.name as venueName',
          'venues.address as venueAddress'
        )
        .join('activities', 'bookings.activityId', 'activities.id')
        .join('children', 'bookings.childId', 'children.id')
        .join('users', 'bookings.parentId', 'users.id')
        .join('venues', 'activities.venueId', 'venues.id')
        .where({ 'bookings.parentId': parentId });

      // Apply filters
      if (filters.status) {
        query = query.where({ 'bookings.status': filters.status });
      }

      if (filters.activityId) {
        query = query.where({ 'bookings.activityId': filters.activityId });
      }

      if (filters.dateFrom) {
        query = query.where('activities.startDate', '>=', new Date(filters.dateFrom));
      }

      if (filters.dateTo) {
        query = query.where('activities.startDate', '<=', new Date(filters.dateTo));
      }

      // Get total count
      const total = await query.clone().count('bookings.id as count').first();
      const totalCount = total ? parseInt(total['count'] as string) : 0;

      // Apply pagination and ordering
      const offset = (page - 1) * limit;
      const bookings = await query
        .orderBy('activities.startDate', 'desc')
        .limit(limit)
        .offset(offset);

      const formattedBookings = bookings.map(booking => ({
        ...booking,
        activity: {
          id: booking.activityId,
          name: booking.activityName,
          startDate: booking.activityStartDate,
          endDate: booking.activityEndDate,
          startTime: booking.activityStartTime,
          endTime: booking.activityEndTime,
          price: booking.activityPrice,
        },
        child: {
          id: booking.childId,
          firstName: booking.childFirstName,
          lastName: booking.childLastName,
          dateOfBirth: booking.childDateOfBirth,
        },
        parent: {
          id: booking.parentId,
          email: booking.parentEmail,
        },
        venue: {
          name: booking.venueName,
          address: booking.venueAddress,
        },
      }));

      return {
        bookings: formattedBookings,
        total: totalCount,
      };
    } catch (error) {
      logger.error('Error finding bookings by parent:', error);
      throw error;
    }
  }

  /**
   * Get all bookings for staff/admin view
   */
  static async findAll(
    page: number = 1,
    limit: number = 20,
    filters: {
      status?: string;
      activityId?: string;
      venueId?: string;
      dateFrom?: string;
      dateTo?: string;
      parentId?: string;
    } = {}
  ): Promise<{ bookings: BookingWithDetails[], total: number }> {
    try {
      let query = db(this.TABLE_NAME)
        .select(
          'bookings.*',
          'activities.name as activityName',
          'activities.startDate as activityStartDate',
          'activities.endDate as activityEndDate',
          'activities.startTime as activityStartTime',
          'activities.endTime as activityEndTime',
          'activities.price as activityPrice',
          'children.firstName as childFirstName',
          'children.lastName as childLastName',
          'children.dateOfBirth as childDateOfBirth',
          'users.email as parentEmail',
          'venues.name as venueName',
          'venues.address as venueAddress'
        )
        .join('activities', 'bookings.activityId', 'activities.id')
        .join('children', 'bookings.childId', 'children.id')
        .join('users', 'bookings.parentId', 'users.id')
        .join('venues', 'activities.venueId', 'venues.id');

      // Apply filters
      if (filters.status) {
        query = query.where({ 'bookings.status': filters.status });
      }

      if (filters.activityId) {
        query = query.where({ 'bookings.activityId': filters.activityId });
      }

      if (filters.venueId) {
        query = query.where({ 'venues.id': filters.venueId });
      }

      if (filters.dateFrom) {
        query = query.where('activities.startDate', '>=', new Date(filters.dateFrom));
      }

      if (filters.dateTo) {
        query = query.where('activities.startDate', '<=', new Date(filters.dateTo));
      }

      if (filters.parentId) {
        query = query.where({ 'bookings.parentId': filters.parentId });
      }

      // Get total count
      const total = await query.clone().count('bookings.id as count').first();
      const totalCount = total ? parseInt(total['count'] as string) : 0;

      // Apply pagination and ordering
      const offset = (page - 1) * limit;
      const bookings = await query
        .orderBy('activities.startDate', 'desc')
        .limit(limit)
        .offset(offset);

      const formattedBookings = bookings.map(booking => ({
        ...booking,
        activity: {
          id: booking.activityId,
          name: booking.activityName,
          startDate: booking.activityStartDate,
          endDate: booking.activityEndDate,
          startTime: booking.activityStartTime,
          endTime: booking.activityEndTime,
          price: booking.activityPrice,
        },
        child: {
          id: booking.childId,
          firstName: booking.childFirstName,
          lastName: booking.childLastName,
          dateOfBirth: booking.childDateOfBirth,
        },
        parent: {
          id: booking.parentId,
          email: booking.parentEmail,
        },
        venue: {
          name: booking.venueName,
          address: booking.venueAddress,
        },
      }));

      return {
        bookings: formattedBookings,
        total: totalCount,
      };
    } catch (error) {
      logger.error('Error finding all bookings:', error);
      throw error;
    }
  }

  /**
   * Update booking
   */
  static async update(
    id: string,
    updateData: UpdateBookingRequest,
    userId: string,
    userRole: string
  ): Promise<Booking | null> {
    try {
      // Check if user can update this booking
      const booking = await this.findById(id);
      if (!booking) {
        throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
      }

      // Only staff/admin or the booking owner can update
      if (userRole !== 'admin' && userRole !== 'staff' && booking.parentId !== userId) {
        throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      const [updatedBooking] = await db(this.TABLE_NAME)
        .where({ id })
        .update({
          ...updateData,
          updatedAt: new Date(),
        })
        .returning('*');

      if (updatedBooking) {
        logger.info(`Booking updated: ${id} by user ${userId}`);
      }

      return updatedBooking || null;
    } catch (error) {
      logger.error('Error updating booking:', error);
      throw error;
    }
  }

  /**
   * Cancel booking
   */
  static async cancel(
    id: string,
    userId: string,
    userRole: string,
    reason?: string
  ): Promise<Booking | null> {
    try {
      // Check if user can cancel this booking
      const booking = await this.findById(id);
      if (!booking) {
        throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
      }

      // Only staff/admin or the booking owner can cancel
      if (userRole !== 'admin' && userRole !== 'staff' && booking.parentId !== userId) {
        throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // Check if booking can be cancelled
      if (booking.status === 'cancelled') {
        throw new AppError('Booking is already cancelled', 400, 'BOOKING_ALREADY_CANCELLED');
      }

      if (booking.status === 'completed') {
        throw new AppError('Cannot cancel completed booking', 400, 'BOOKING_COMPLETED');
      }

      // Check if activity has started
      const activity = await ActivityModel.findById(booking.activityId);
      if (activity && new Date(activity.startDate) <= new Date()) {
        throw new AppError('Cannot cancel booking for activity that has started', 400, 'ACTIVITY_STARTED');
      }

      // Cancel booking in transaction
      const result = await db.transaction(async (trx) => {
        // Update booking status
        const [updatedBooking] = await trx(this.TABLE_NAME)
          .where({ id })
          .update({
            status: 'cancelled',
            cancelledAt: new Date(),
            updatedAt: new Date(),
          })
          .returning('*');

        // Update activity booking count
        await ActivityModel.updateBookingCount(booking.activityId, false);

        return updatedBooking;
      });

      logger.info(`Booking cancelled: ${id} by user ${userId}. Reason: ${reason || 'No reason provided'}`);
      return result;
    } catch (error) {
      logger.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Confirm booking (staff/admin only)
   */
  static async confirm(id: string, userId: string): Promise<Booking | null> {
    try {
      const [updatedBooking] = await db(this.TABLE_NAME)
        .where({ id, status: 'pending' })
        .update({
          status: 'confirmed',
          updatedAt: new Date(),
        })
        .returning('*');

      if (updatedBooking) {
        logger.info(`Booking confirmed: ${id} by staff ${userId}`);
      }

      return updatedBooking || null;
    } catch (error) {
      logger.error('Error confirming booking:', error);
      throw error;
    }
  }

  /**
   * Delete booking (staff/admin only)
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const booking = await this.findById(id);
      if (!booking) {
        throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
      }

      // Check if booking can be deleted
      if (booking.status === 'confirmed') {
        throw new AppError('Cannot delete confirmed booking', 400, 'BOOKING_CONFIRMED');
      }

      const result = await db(this.TABLE_NAME)
        .where({ id })
        .del();

      if (result > 0) {
        // Update activity booking count if booking was pending
        if (booking.status === 'pending') {
          await ActivityModel.updateBookingCount(booking.activityId, false);
        }
        logger.info(`Booking deleted: ${id}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error deleting booking:', error);
      throw error;
    }
  }

  /**
   * Get booking statistics
   */
  static async getStats(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    totalRevenue: number;
    byStatus: Record<string, number>;
  }> {
    try {
      const stats = await db(this.TABLE_NAME)
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('COUNT(CASE WHEN status = \'pending\' THEN 1 END) as pending'),
          db.raw('COUNT(CASE WHEN status = \'confirmed\' THEN 1 END) as confirmed'),
          db.raw('COUNT(CASE WHEN status = \'cancelled\' THEN 1 END) as cancelled'),
          db.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed'),
          db.raw('SUM(CASE WHEN status = \'confirmed\' THEN totalAmount ELSE 0 END) as totalRevenue')
        )
        .first();

      return {
        total: parseInt(stats.total as string),
        pending: parseInt(stats.pending as string),
        confirmed: parseInt(stats.confirmed as string),
        cancelled: parseInt(stats.cancelled as string),
        completed: parseInt(stats.completed as string),
        totalRevenue: parseFloat(stats.totalRevenue as string) || 0,
        byStatus: {
          pending: parseInt(stats.pending as string),
          confirmed: parseInt(stats.confirmed as string),
          cancelled: parseInt(stats.cancelled as string),
          completed: parseInt(stats.completed as string),
        },
      };
    } catch (error) {
      logger.error('Error getting booking stats:', error);
      throw error;
    }
  }

  /**
   * Calculate age from date of birth
   */
  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}
