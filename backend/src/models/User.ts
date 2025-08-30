import { db } from '../utils/database';
import { User, CreateUserRequest, UpdateUserRequest } from '../types';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

export class UserModel {
  private static readonly TABLE_NAME = 'users';

  /**
   * Create a new user
   */
  static async create(userData: CreateUserRequest): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const [user] = await db(this.TABLE_NAME)
        .insert({
          ...userData,
          password: hashedPassword,
          isEmailVerified: false,
          isActive: true,
          role: userData.role || 'parent',
        })
        .returning('*');

      logger.info(`User created: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    try {
      const user = await db(this.TABLE_NAME)
        .where({ id, isActive: true })
        .first();

      return user || null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await db(this.TABLE_NAME)
        .where({ email: email.toLowerCase(), isActive: true })
        .first();

      return user || null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async update(id: string, updateData: UpdateUserRequest): Promise<User | null> {
    try {
      const [updatedUser] = await db(this.TABLE_NAME)
        .where({ id, isActive: true })
        .update({
          ...updateData,
          updatedAt: new Date(),
        })
        .returning('*');

      if (updatedUser) {
        logger.info(`User updated: ${updatedUser.email}`);
      }

      return updatedUser || null;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const result = await db(this.TABLE_NAME)
        .where({ id })
        .update({
          isActive: false,
          updatedAt: new Date(),
        });

      if (result > 0) {
        logger.info(`User soft deleted: ${id}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get all users with pagination
   */
  static async findAll(page: number = 1, limit: number = 20, filters: any = {}): Promise<{ users: User[], total: number }> {
    try {
      let query = db(this.TABLE_NAME).where({ isActive: true });

      // Apply filters
      if (filters.role) {
        query = query.where({ role: filters.role });
      }

      if (filters.search) {
        query = query.where(function() {
          this.where('firstName', 'ilike', `%${filters.search}%`)
            .orWhere('lastName', 'ilike', `%${filters.search}%`)
            .orWhere('email', 'ilike', `%${filters.search}%`);
        });
      }

      // Get total count
      const total = await query.clone().count('* as count').first();
      const totalCount = total ? parseInt(total['count'] as string) : 0;

      // Apply pagination
      const offset = (page - 1) * limit;
      const users = await query
        .select('*')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset);

      return {
        users,
        total: totalCount,
      };
    } catch (error) {
      logger.error('Error finding all users:', error);
      throw error;
    }
  }

  /**
   * Verify user email
   */
  static async verifyEmail(id: string): Promise<boolean> {
    try {
      const result = await db(this.TABLE_NAME)
        .where({ id })
        .update({
          isEmailVerified: true,
          updatedAt: new Date(),
        });

      if (result > 0) {
        logger.info(`User email verified: ${id}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error verifying user email:', error);
      throw error;
    }
  }

  /**
   * Update last login time
   */
  static async updateLastLogin(id: string): Promise<void> {
    try {
      await db(this.TABLE_NAME)
        .where({ id })
        .update({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        });
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(id: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      const result = await db(this.TABLE_NAME)
        .where({ id })
        .update({
          password: hashedPassword,
          updatedAt: new Date(),
        });

      if (result > 0) {
        logger.info(`User password changed: ${id}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error changing user password:', error);
      throw error;
    }
  }

  /**
   * Check if password matches
   */
  static async checkPassword(userId: string, password: string): Promise<boolean> {
    try {
      const user = await this.findById(userId);
      if (!user) return false;

      if (!user.password_hash) return false;
      return await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      logger.error('Error checking password:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getStats(): Promise<{ total: number; active: number; verified: number; byRole: Record<string, number> }> {
    try {
      const stats = await db(this.TABLE_NAME)
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('COUNT(CASE WHEN "isActive" = true THEN 1 END) as active'),
          db.raw('COUNT(CASE WHEN "isEmailVerified" = true THEN 1 END) as verified'),
          db.raw('COUNT(CASE WHEN role = \'parent\' THEN 1 END) as parents'),
          db.raw('COUNT(CASE WHEN role = \'staff\' THEN 1 END) as staff'),
          db.raw('COUNT(CASE WHEN role = \'admin\' THEN 1 END) as admins')
        )
        .first();

      return {
        total: parseInt(stats.total as string),
        active: parseInt(stats.active as string),
        verified: parseInt(stats.verified as string),
        byRole: {
          parent: parseInt(stats.parents as string),
          staff: parseInt(stats.staff as string),
          admin: parseInt(stats.admins as string),
        },
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }
}
