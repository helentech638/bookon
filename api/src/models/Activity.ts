import { db } from '../utils/database';
import { Activity, CreateActivityRequest, UpdateActivityRequest } from '../types';
import { logger } from '../utils/logger';

export class ActivityModel {
  private static readonly TABLE_NAME = 'activities';

  /**
   * Create a new activity
   */
  static async create(activityData: CreateActivityRequest): Promise<Activity> {
    try {
      // Validate venue exists
      const venue = await db('venues')
        .where({ id: activityData.venueId, isActive: true })
        .first();
      
      if (!venue) {
        throw new Error('Venue not found or inactive');
      }

      // Validate dates
      const startDate = new Date(activityData.startDate);
      const endDate = new Date(activityData.endDate);
      
      if (startDate >= endDate) {
        throw new Error('Start date must be before end date');
      }

      if (startDate < new Date()) {
        throw new Error('Start date cannot be in the past');
      }

      const [activity] = await db(this.TABLE_NAME)
        .insert({
          ...activityData,
          startDate,
          endDate,
          currentBookings: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning('*');

      logger.info(`Activity created: ${activity.name} at ${venue.name}`);
      return activity;
    } catch (error) {
      logger.error('Error creating activity:', error);
      throw error;
    }
  }

  /**
   * Find activity by ID
   */
  static async findById(id: string): Promise<Activity | null> {
    try {
      const activity = await db(this.TABLE_NAME)
        .where({ id, isActive: true })
        .first();

      return activity || null;
    } catch (error) {
      logger.error('Error finding activity by ID:', error);
      throw error;
    }
  }

  /**
   * Find activity by ID with venue details
   */
  static async findByIdWithVenue(id: string): Promise<(Activity & { venue: any }) | null> {
    try {
      const activity = await db(this.TABLE_NAME)
        .select('activities.*', 'venues.name as venueName', 'venues.address as venueAddress')
        .join('venues', 'activities.venueId', 'venues.id')
        .where({ 'activities.id': id, 'activities.isActive': true })
        .first();

      if (!activity) return null;

      return {
        ...activity,
        venue: {
          id: activity.venueId,
          name: activity.venueName,
          address: activity.venueAddress,
        },
      };
    } catch (error) {
      logger.error('Error finding activity with venue:', error);
      throw error;
    }
  }

  /**
   * Get all activities with pagination and filtering
   */
  static async findAll(
    page: number = 1,
    limit: number = 20,
    filters: {
      venueId?: string;
      category?: string;
      dateFrom?: string;
      dateTo?: string;
      priceMin?: number;
      priceMax?: number;
      search?: string;
      availableOnly?: boolean;
    } = {}
  ): Promise<{ activities: Activity[], total: number }> {
    try {
      let query = db(this.TABLE_NAME)
        .select('activities.*', 'venues.name as venueName')
        .join('venues', 'activities.venueId', 'venues.id')
        .where({ 'activities.isActive': true });

      // Apply filters
      if (filters.venueId) {
        query = query.where({ 'activities.venueId': filters.venueId });
      }

      if (filters.category) {
        query = query.where({ 'activities.category': filters.category });
      }

      if (filters.dateFrom) {
        query = query.where('activities.startDate', '>=', new Date(filters.dateFrom));
      }

      if (filters.dateTo) {
        query = query.where('activities.endDate', '<=', new Date(filters.dateTo));
      }

      if (filters.priceMin !== undefined) {
        query = query.where('activities.price', '>=', filters.priceMin);
      }

      if (filters.priceMax !== undefined) {
        query = query.where('activities.price', '<=', filters.priceMax);
      }

      if (filters.search) {
        query = query.where(function() {
          this.where('activities.name', 'ilike', `%${filters.search}%`)
            .orWhere('activities.description', 'ilike', `%${filters.search}%`)
            .orWhere('venues.name', 'ilike', `%${filters.search}%`);
        });
      }

      if (filters.availableOnly) {
        query = query.whereRaw('activities.currentBookings < activities.maxCapacity');
      }

      // Get total count
      const total = await query.clone().count('activities.id as count').first();
      const totalCount = total ? parseInt(total['count'] as string) : 0;

      // Apply pagination and ordering
      const offset = (page - 1) * limit;
      const activities = await query
        .orderBy('activities.startDate', 'asc')
        .limit(limit)
        .offset(offset);

      return {
        activities: activities.map(activity => ({
          ...activity,
          venueName: activity.venueName,
        })),
        total: totalCount,
      };
    } catch (error) {
      logger.error('Error finding all activities:', error);
      throw error;
    }
  }

  /**
   * Update activity
   */
  static async update(id: string, updateData: UpdateActivityRequest): Promise<Activity | null> {
    try {
      // Validate dates if provided
      if (updateData.startDate && updateData.endDate) {
        const startDate = new Date(updateData.startDate);
        const endDate = new Date(updateData.endDate);
        
        if (startDate >= endDate) {
          throw new Error('Start date must be before end date');
        }
      }

      const [updatedActivity] = await db(this.TABLE_NAME)
        .where({ id, isActive: true })
        .update({
          ...updateData,
          ...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
          ...(updateData.endDate && { endDate: new Date(updateData.endDate) }),
          updatedAt: new Date(),
        })
        .returning('*');

      if (updatedActivity) {
        logger.info(`Activity updated: ${updatedActivity.name}`);
      }

      return updatedActivity || null;
    } catch (error) {
      logger.error('Error updating activity:', error);
      throw error;
    }
  }

  /**
   * Delete activity (soft delete)
   */
  static async delete(id: string): Promise<boolean> {
    try {
      // Check if there are any active bookings
      const activeBookings = await db('bookings')
        .where({ activityId: id, status: 'confirmed' })
        .count('* as count')
        .first();

      if (activeBookings && parseInt(activeBookings['count'] as string) > 0) {
        throw new Error('Cannot delete activity with active bookings');
      }

      const result = await db(this.TABLE_NAME)
        .where({ id })
        .update({
          isActive: false,
          updatedAt: new Date(),
        });

      if (result > 0) {
        logger.info(`Activity soft deleted: ${id}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error deleting activity:', error);
      throw error;
    }
  }

  /**
   * Check activity availability
   */
  static async checkAvailability(id: string): Promise<{
    available: boolean;
    remainingSpots: number;
    fullyBooked: boolean;
  }> {
    try {
      const activity = await this.findById(id);
      if (!activity) {
        throw new Error('Activity not found');
      }

      const remainingSpots = activity.maxCapacity - activity.currentBookings;
      const available = remainingSpots > 0;
      const fullyBooked = remainingSpots === 0;

      return {
        available,
        remainingSpots,
        fullyBooked,
      };
    } catch (error) {
      logger.error('Error checking activity availability:', error);
      throw error;
    }
  }

  /**
   * Update booking count
   */
  static async updateBookingCount(id: string, increment: boolean = true): Promise<void> {
    try {
      const operation = increment ? 'increment' : 'decrement';
      await db(this.TABLE_NAME)
        .where({ id })
        .update({
          currentBookings: db.raw(`currentBookings ${increment ? '+' : '-'} 1`),
          updatedAt: new Date(),
        });

      logger.debug(`Activity ${id} booking count ${operation}d`);
    } catch (error) {
      logger.error('Error updating activity booking count:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics
   */
  static async getStats(): Promise<{
    total: number;
    active: number;
    upcoming: number;
    fullyBooked: number;
    byCategory: Record<string, number>;
  }> {
    try {
      const stats = await db(this.TABLE_NAME)
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('COUNT(CASE WHEN "isActive" = true THEN 1 END) as active'),
          db.raw('COUNT(CASE WHEN "startDate" > NOW() THEN 1 END) as upcoming'),
          db.raw('COUNT(CASE WHEN "currentBookings" >= "maxCapacity" THEN 1 END) as fullyBooked'),
          db.raw('COUNT(CASE WHEN category = \'sports\' THEN 1 END) as sports'),
          db.raw('COUNT(CASE WHEN category = \'arts\' THEN 1 END) as arts'),
          db.raw('COUNT(CASE WHEN category = \'academic\' THEN 1 END) as academic'),
          db.raw('COUNT(CASE WHEN category = \'recreation\' THEN 1 END) as recreation')
        )
        .first();

      return {
        total: parseInt(stats.total as string),
        active: parseInt(stats.active as string),
        upcoming: parseInt(stats.upcoming as string),
        fullyBooked: parseInt(stats.fullyBooked as string),
        byCategory: {
          sports: parseInt(stats.sports as string),
          arts: parseInt(stats.arts as string),
          academic: parseInt(stats.academic as string),
          recreation: parseInt(stats.recreation as string),
        },
      };
    } catch (error) {
      logger.error('Error getting activity stats:', error);
      throw error;
    }
  }
}
