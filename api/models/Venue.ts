import { db } from '../utils/database';
import { Venue, CreateVenueRequest, UpdateVenueRequest } from '../types';
import { logger } from '../utils/logger';

export class VenueModel {
  private static readonly TABLE_NAME = 'venues';

  /**
   * Create a new venue
   */
  static async create(venueData: CreateVenueRequest): Promise<Venue> {
    try {
      // Validate required fields
      if (!venueData.name || !venueData.address || !venueData.city || !venueData.postcode) {
        throw new Error('Name, address, city, and postcode are required');
      }

      const [venue] = await db(this.TABLE_NAME)
        .insert({
          ...venueData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning('*');

      logger.info(`Venue created: ${venue.name} in ${venue.city}`);
      return venue;
    } catch (error) {
      logger.error('Error creating venue:', error);
      throw error;
    }
  }

  /**
   * Find venue by ID
   */
  static async findById(id: string): Promise<Venue | null> {
    try {
      const venue = await db(this.TABLE_NAME)
        .where({ id, isActive: true })
        .first();

      return venue || null;
    } catch (error) {
      logger.error('Error finding venue by ID:', error);
      throw error;
    }
  }

  /**
   * Find venue by ID with activity count
   */
  static async findByIdWithStats(id: string): Promise<(Venue & { activityCount: number; upcomingActivities: number }) | null> {
    try {
      const venue = await db(this.TABLE_NAME)
        .select(
          'venues.*',
          db.raw('COUNT(activities.id) as activityCount'),
          db.raw('COUNT(CASE WHEN activities.startDate > NOW() THEN 1 END) as upcomingActivities')
        )
        .leftJoin('activities', 'venues.id', 'activities.venueId')
        .where({ 'venues.id': id, 'venues.isActive': true })
        .groupBy('venues.id')
        .first();

      if (!venue) return null;

      return {
        ...venue,
        activityCount: parseInt(venue.activityCount as string),
        upcomingActivities: parseInt(venue.upcomingActivities as string),
      };
    } catch (error) {
      logger.error('Error finding venue with stats:', error);
      throw error;
    }
  }

  /**
   * Get all venues with pagination and filtering
   */
  static async findAll(
    page: number = 1,
    limit: number = 20,
    filters: {
      city?: string;
      search?: string;
      hasActivities?: boolean;
      capacityMin?: number;
      capacityMax?: number;
    } = {}
  ): Promise<{ venues: Venue[], total: number }> {
    try {
      let query = db(this.TABLE_NAME)
        .select('venues.*')
        .where({ 'venues.isActive': true });

      // Apply filters
      if (filters.city) {
        query = query.where('venues.city', 'ilike', `%${filters.city}%`);
      }

      if (filters.search) {
        query = query.where(function() {
          this.where('venues.name', 'ilike', `%${filters.search}%`)
            .orWhere('venues.description', 'ilike', `%${filters.search}%`)
            .orWhere('venues.address', 'ilike', `%${filters.search}%`);
        });
      }

      if (filters.hasActivities) {
        query = query.whereExists(
          db.select('*').from('activities').whereRaw('activities.venueId = venues.id')
        );
      }

      if (filters.capacityMin !== undefined) {
        query = query.where('venues.capacity', '>=', filters.capacityMin);
      }

      if (filters.capacityMax !== undefined) {
        query = query.where('venues.capacity', '<=', filters.capacityMax);
      }

      // Get total count
      const total = await query.clone().count('venues.id as count').first();
      const totalCount = total ? parseInt(total['count'] as string) : 0;

      // Apply pagination and ordering
      const offset = (page - 1) * limit;
      const venues = await query
        .orderBy('venues.name', 'asc')
        .limit(limit)
        .offset(offset);

      return {
        venues,
        total: totalCount,
      };
    } catch (error) {
      logger.error('Error finding all venues:', error);
      throw error;
    }
  }

  /**
   * Update venue
   */
  static async update(id: string, updateData: UpdateVenueRequest): Promise<Venue | null> {
    try {
      const [updatedVenue] = await db(this.TABLE_NAME)
        .where({ id, isActive: true })
        .update({
          ...updateData,
          updatedAt: new Date(),
        })
        .returning('*');

      if (updatedVenue) {
        logger.info(`Venue updated: ${updatedVenue.name}`);
      }

      return updatedVenue || null;
    } catch (error) {
      logger.error('Error updating venue:', error);
      throw error;
    }
  }

  /**
   * Delete venue (soft delete)
   */
  static async delete(id: string): Promise<boolean> {
    try {
      // Check if there are any active activities
      const activeActivities = await db('activities')
        .where({ venueId: id, isActive: true })
        .count('* as count')
        .first();

      if (activeActivities && parseInt(activeActivities['count'] as string) > 0) {
        throw new Error('Cannot delete venue with active activities');
      }

      const result = await db(this.TABLE_NAME)
        .where({ id })
        .update({
          isActive: false,
          updatedAt: new Date(),
        });

      if (result > 0) {
        logger.info(`Venue soft deleted: ${id}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error deleting venue:', error);
      throw error;
    }
  }

  /**
   * Get venues by city
   */
  static async findByCity(city: string): Promise<Venue[]> {
    try {
      const venues = await db(this.TABLE_NAME)
        .where({ city: city.toLowerCase(), isActive: true })
        .orderBy('name', 'asc');

      return venues;
    } catch (error) {
      logger.error('Error finding venues by city:', error);
      throw error;
    }
  }

  /**
   * Get venue statistics
   */
  static async getStats(): Promise<{
    total: number;
    active: number;
    byCity: Record<string, number>;
    averageCapacity: number;
    totalActivities: number;
  }> {
    try {
      const stats = await db(this.TABLE_NAME)
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('COUNT(CASE WHEN "isActive" = true THEN 1 END) as active'),
          db.raw('AVG(capacity) as averageCapacity'),
          db.raw('COUNT(CASE WHEN city = \'London\' THEN 1 END) as london'),
          db.raw('COUNT(CASE WHEN city = \'Manchester\' THEN 1 END) as manchester'),
          db.raw('COUNT(CASE WHEN city = \'Birmingham\' THEN 1 END) as birmingham'),
          db.raw('COUNT(CASE WHEN city = \'Leeds\' THEN 1 END) as leeds'),
          db.raw('COUNT(CASE WHEN city = \'Liverpool\' THEN 1 END) as liverpool')
        )
        .first();

      // Get total activities across all venues
      const totalActivities = await db('activities')
        .where({ isActive: true })
        .count('* as count')
        .first();

      return {
        total: parseInt(stats.total as string),
        active: parseInt(stats.active as string),
        averageCapacity: Math.round(parseFloat(stats.averageCapacity as string) || 0),
        totalActivities: totalActivities ? parseInt(totalActivities['count'] as string) : 0,
        byCity: {
          London: parseInt(stats.london as string),
          Manchester: parseInt(stats.manchester as string),
          Birmingham: parseInt(stats.birmingham as string),
          Leeds: parseInt(stats.leeds as string),
          Liverpool: parseInt(stats.liverpool as string),
        },
      };
    } catch (error) {
      logger.error('Error getting venue stats:', error);
      throw error;
    }
  }

  /**
   * Search venues by location
   */
  static async searchByLocation(
    _latitude: number,
    _longitude: number,
    _radiusKm: number = 10
  ): Promise<Venue[]> {
    try {
      // Simple distance calculation (Haversine formula would be better for production)
      // For now, we'll return venues in the same city
      const venues = await db(this.TABLE_NAME)
        .where({ isActive: true })
        .orderBy('name', 'asc');

      // TODO: Implement proper geospatial search with PostGIS
      // This is a placeholder for the actual implementation
      return venues;
    } catch (error) {
      logger.error('Error searching venues by location:', error);
      throw error;
    }
  }
}
