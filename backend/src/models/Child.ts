import { db } from '../utils/database';
import { Child, CreateChildRequest, UpdateChildRequest } from '../types';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class ChildModel {
  private static readonly TABLE_NAME = 'children';

  /**
   * Create a new child
   */
  static async create(
    childData: CreateChildRequest,
    parentId: string
  ): Promise<Child> {
    try {
      // Validate required fields
      if (!childData.firstName || !childData.lastName || !childData.dateOfBirth) {
        throw new AppError('First name, last name, and date of birth are required', 400, 'MISSING_REQUIRED_FIELDS');
      }

      // Validate date of birth is not in the future
      const dateOfBirth = new Date(childData.dateOfBirth);
      if (dateOfBirth > new Date()) {
        throw new AppError('Date of birth cannot be in the future', 400, 'INVALID_DATE_OF_BIRTH');
      }

      // Validate age is reasonable (between 0 and 18)
      const age = this.calculateAge(dateOfBirth);
      if (age < 0 || age > 18) {
        throw new AppError('Child must be between 0 and 18 years old', 400, 'INVALID_AGE');
      }

      // Validate parent exists
      const parent = await db('users')
        .where({ id: parentId, isActive: true })
        .first();

      if (!parent) {
        throw new AppError('Parent not found or inactive', 404, 'PARENT_NOT_FOUND');
      }

      const [child] = await db(this.TABLE_NAME)
        .insert({
          ...childData,
          parentId,
          dateOfBirth,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning('*');

      logger.info(`Child created: ${child.firstName} ${child.lastName} for parent ${parentId}`);
      return child;
    } catch (error) {
      logger.error('Error creating child:', error);
      throw error;
    }
  }

  /**
   * Find child by ID
   */
  static async findById(id: string): Promise<Child | null> {
    try {
      const child = await db(this.TABLE_NAME)
        .where({ id, isActive: true })
        .first();

      return child || null;
    } catch (error) {
      logger.error('Error finding child by ID:', error);
      throw error;
    }
  }

  /**
   * Find child by ID with parent details
   */
  static async findByIdWithParent(id: string): Promise<(Child & { parent: any }) | null> {
    try {
      const child = await db(this.TABLE_NAME)
        .select(
          'children.*',
          'users.email as parentEmail',
          'users.firstName as parentFirstName',
          'users.lastName as parentLastName'
        )
        .join('users', 'children.parentId', 'users.id')
        .where({ 'children.id': id, 'children.isActive': true })
        .first();

      if (!child) return null;

      return {
        ...child,
        parent: {
          id: child.parentId,
          email: child.parentEmail,
          firstName: child.parentFirstName,
          lastName: child.parentLastName,
        },
      };
    } catch (error) {
      logger.error('Error finding child with parent:', error);
      throw error;
    }
  }

  /**
   * Get all children for a parent
   */
  static async findByParent(
    parentId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ children: Child[], total: number }> {
    try {
      let query = db(this.TABLE_NAME)
        .where({ parentId, isActive: true });

      // Get total count
      const total = await query.clone().count('id as count').first();
      const totalCount = total ? parseInt(total['count'] as string) : 0;

      // Apply pagination and ordering
      const offset = (page - 1) * limit;
      const children = await query
        .orderBy('firstName', 'asc')
        .limit(limit)
        .offset(offset);

      return {
        children,
        total: totalCount,
      };
    } catch (error) {
      logger.error('Error finding children by parent:', error);
      throw error;
    }
  }

  /**
   * Get all children (staff/admin only)
   */
  static async findAll(
    page: number = 1,
    limit: number = 20,
    filters: {
      parentId?: string;
      ageMin?: number;
      ageMax?: number;
      search?: string;
    } = {}
  ): Promise<{ children: (Child & { parent: any })[], total: number }> {
    try {
      let query = db(this.TABLE_NAME)
        .select(
          'children.*',
          'users.email as parentEmail',
          'users.firstName as parentFirstName',
          'users.lastName as parentLastName'
        )
        .join('users', 'children.parentId', 'users.id')
        .where({ 'children.isActive': true });

      // Apply filters
      if (filters.parentId) {
        query = query.where({ 'children.parentId': filters.parentId });
      }

      if (filters.search) {
        query = query.where(function() {
          this.where('children.firstName', 'ilike', `%${filters.search}%`)
            .orWhere('children.lastName', 'ilike', `%${filters.search}%`)
            .orWhere('users.email', 'ilike', `%${filters.search}%`);
        });
      }

      // Get total count
      const total = await query.clone().count('children.id as count').first();
      const totalCount = total ? parseInt(total['count'] as string) : 0;

      // Apply pagination and ordering
      const offset = (page - 1) * limit;
      const children = await query
        .orderBy('children.firstName', 'asc')
        .limit(limit)
        .offset(offset);

      const formattedChildren = children.map(child => ({
        ...child,
        parent: {
          id: child.parentId,
          email: child.parentEmail,
          firstName: child.parentFirstName,
          lastName: child.parentLastName,
        },
      }));

      // Apply age filters after fetching (since we need to calculate age)
      let filteredChildren = formattedChildren;
      if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
        filteredChildren = formattedChildren.filter(child => {
          const age = this.calculateAge(child.dateOfBirth);
          if (filters.ageMin !== undefined && age < filters.ageMin) return false;
          if (filters.ageMax !== undefined && age > filters.ageMax) return false;
          return true;
        });
      }

      return {
        children: filteredChildren,
        total: totalCount,
      };
    } catch (error) {
      logger.error('Error finding all children:', error);
      throw error;
    }
  }

  /**
   * Update child
   */
  static async update(
    id: string,
    updateData: UpdateChildRequest,
    userId: string,
    userRole: string
  ): Promise<Child | null> {
    try {
      // Check if user can update this child
      const child = await this.findById(id);
      if (!child) {
        throw new AppError('Child not found', 404, 'CHILD_NOT_FOUND');
      }

      // Only staff/admin or the child's parent can update
      if (userRole !== 'admin' && userRole !== 'staff' && child.parentId !== userId) {
        throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // Validate date of birth if provided
      if (updateData.dateOfBirth) {
        const dateOfBirth = new Date(updateData.dateOfBirth);
        if (dateOfBirth > new Date()) {
          throw new AppError('Date of birth cannot be in the future', 400, 'INVALID_DATE_OF_BIRTH');
        }

        const age = this.calculateAge(dateOfBirth);
        if (age < 0 || age > 18) {
          throw new AppError('Child must be between 0 and 18 years old', 400, 'INVALID_AGE');
        }
      }

      const [updatedChild] = await db(this.TABLE_NAME)
        .where({ id })
        .update({
          ...updateData,
          ...(updateData.dateOfBirth && { dateOfBirth: new Date(updateData.dateOfBirth) }),
          updatedAt: new Date(),
        })
        .returning('*');

      if (updatedChild) {
        logger.info(`Child updated: ${id} by user ${userId}`);
      }

      return updatedChild || null;
    } catch (error) {
      logger.error('Error updating child:', error);
      throw error;
    }
  }

  /**
   * Delete child (soft delete)
   */
  static async delete(
    id: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    try {
      // Check if user can delete this child
      const child = await this.findById(id);
      if (!child) {
        throw new AppError('Child not found', 404, 'CHILD_NOT_FOUND');
      }

      // Only staff/admin or the child's parent can delete
      if (userRole !== 'admin' && userRole !== 'staff' && child.parentId !== userId) {
        throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // Check if child has active bookings
      const activeBookings = await db('bookings')
        .where({ childId: id, status: 'confirmed' })
        .count('* as count')
        .first();

      if (activeBookings && parseInt(activeBookings['count'] as string) > 0) {
        throw new AppError('Cannot delete child with active bookings', 400, 'CHILD_HAS_ACTIVE_BOOKINGS');
      }

      const result = await db(this.TABLE_NAME)
        .where({ id })
        .update({
          isActive: false,
          updatedAt: new Date(),
        });

      if (result > 0) {
        logger.info(`Child soft deleted: ${id} by user ${userId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error deleting child:', error);
      throw error;
    }
  }

  /**
   * Get child statistics
   */
  static async getStats(): Promise<{
    total: number;
    active: number;
    byAgeGroup: Record<string, number>;
    averageAge: number;
    totalParents: number;
  }> {
    try {
      const stats = await db(this.TABLE_NAME)
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('COUNT(CASE WHEN "isActive" = true THEN 1 END) as active'),
          db.raw('COUNT(CASE WHEN "dateOfBirth" >= NOW() - INTERVAL \'5 years\' THEN 1 END) as age0to5'),
          db.raw('COUNT(CASE WHEN "dateOfBirth" >= NOW() - INTERVAL \'10 years\' AND "dateOfBirth" < NOW() - INTERVAL \'5 years\' THEN 1 END) as age6to10'),
          db.raw('COUNT(CASE WHEN "dateOfBirth" >= NOW() - INTERVAL \'15 years\' AND "dateOfBirth" < NOW() - INTERVAL \'10 years\' THEN 1 END) as age11to15'),
          db.raw('COUNT(CASE WHEN "dateOfBirth" < NOW() - INTERVAL \'15 years\' THEN 1 END) as age16to18')
        )
        .first();

      // Get unique parent count
      const uniqueParents = await db(this.TABLE_NAME)
        .distinct('parentId')
        .where({ isActive: true })
        .count('* as count')
        .first();

      return {
        total: parseInt(stats.total as string),
        active: parseInt(stats.active as string),
        averageAge: 9, // Placeholder - would need to calculate actual average
        totalParents: uniqueParents ? parseInt(uniqueParents['count'] as string) : 0,
        byAgeGroup: {
          '0-5': parseInt(stats.age0to5 as string),
          '6-10': parseInt(stats.age6to10 as string),
          '11-15': parseInt(stats.age11to15 as string),
          '16-18': parseInt(stats.age16to18 as string),
        },
      };
    } catch (error) {
      logger.error('Error getting child stats:', error);
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

  /**
   * Get children by age range
   */
  static async findByAgeRange(minAge: number, maxAge: number): Promise<Child[]> {
    try {
      const children = await db(this.TABLE_NAME)
        .where({ isActive: true })
        .orderBy('firstName', 'asc');

      // Filter by age range
      return children.filter(child => {
        const age = this.calculateAge(child.dateOfBirth);
        return age >= minAge && age <= maxAge;
      });
    } catch (error) {
      logger.error('Error finding children by age range:', error);
      throw error;
    }
  }

  /**
   * Get children with upcoming activities
   */
  static async findWithUpcomingActivities(parentId: string): Promise<(Child & { upcomingActivities: any[] })[]> {
    try {
      const children = await db(this.TABLE_NAME)
        .select('children.*')
        .where({ 'children.parentId': parentId, 'children.isActive': true });

      // Get upcoming activities for each child
      const childrenWithActivities = await Promise.all(
        children.map(async (child) => {
          const upcomingActivities = await db('bookings')
            .select(
              'bookings.*',
              'activities.name as activityName',
              'activities.startDate',
              'activities.startTime',
              'venues.name as venueName'
            )
            .join('activities', 'bookings.activityId', 'activities.id')
            .join('venues', 'activities.venueId', 'venues.id')
            .where({
              'bookings.childId': child.id,
              'bookings.status': 'confirmed',
            })
            .where('activities.startDate', '>', new Date())
            .orderBy('activities.startDate', 'asc');

          return {
            ...child,
            upcomingActivities,
          };
        })
      );

      return childrenWithActivities;
    } catch (error) {
      logger.error('Error finding children with upcoming activities:', error);
      throw error;
    }
  }
}
