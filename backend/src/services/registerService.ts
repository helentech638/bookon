import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

interface RegisterData {
  sessionId: string;
  date: Date;
  notes?: string;
}

interface AttendanceRecord {
  childId: string;
  present: boolean;
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
}

class RegisterService {
  async createRegister(sessionId: string, notes?: string) {
    try {
      return await safePrismaQuery(async (client) => {
        // Get session details
        const session = await client.session.findUnique({
          where: { id: sessionId },
          include: {
            activity: {
              select: {
                title: true,
                type: true,
                venue: {
                  select: {
                    name: true,
                    address: true
                  }
                }
              }
            }
          }
        });

        if (!session) {
          throw new Error('Session not found');
        }

        // Create register
        const register = await client.register.create({
          data: {
            sessionId: session.id,
            date: session.date,
            notes,
            status: 'active'
          },
          include: {
            session: {
              include: {
                activity: {
                  select: {
                    title: true,
                    type: true,
                    venue: {
                      select: {
                        name: true,
                        address: true
                      }
                    }
                  }
                }
              }
            }
          }
        });

        logger.info('Register created', {
          registerId: register.id,
          sessionId,
          activityId: session.activityId,
          date: session.date
        });

        return register;
      });
    } catch (error) {
      logger.error('Failed to create register:', error);
      throw error;
    }
  }

  async getRegister(registerId: string) {
    try {
      return await safePrismaQuery(async (client) => {
        return await client.register.findUnique({
          where: { id: registerId },
          include: {
            session: {
              include: {
                activity: {
                  select: {
                    title: true,
                    type: true,
                    venue: {
                      select: {
                        name: true,
                        address: true
                      }
                    }
                  }
                }
              }
            },
          }
        });
      });
    } catch (error) {
      logger.error('Failed to get register:', error);
      throw error;
    }
  }

  async getRegistersByActivity(activityId: string, dateFrom?: Date, dateTo?: Date) {
    try {
      return await safePrismaQuery(async (client) => {
        const where: any = { activityId };
        
        if (dateFrom || dateTo) {
          where.date = {};
          if (dateFrom) where.date.gte = dateFrom;
          if (dateTo) where.date.lte = dateTo;
        }

        return await client.register.findMany({
          where,
          include: {
            activity: {
              select: {
                title: true,
                type: true
              }
            },
            _count: {
              select: {
                attendance: true
              }
            }
          },
          orderBy: { date: 'desc' }
        });
      });
    } catch (error) {
      logger.error('Failed to get registers by activity:', error);
      throw error;
    }
  }

  async getRegistersBySession(sessionId: string) {
    try {
      return await safePrismaQuery(async (client) => {
        return await client.register.findMany({
          where: { activityId },
          include: {
            activity: {
              select: {
                title: true,
                type: true
              }
            },
            _count: {
              select: {
                attendance: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      });
    } catch (error) {
      logger.error('Failed to get registers by session:', error);
      throw error;
    }
  }

  async updateAttendance(registerId: string, attendanceRecords: AttendanceRecord[]) {
    try {
      return await safePrismaQuery(async (client) => {
        const register = await client.register.findUnique({
          where: { id: registerId },
          include: {
            activity: {
              select: {
                title: true
              }
            }
          }
        });

        if (!register) {
          throw new Error('Register not found');
        }

        // Get existing attendance records - TODO: Implement attendance model
        const existingAttendance: any[] = [];

        // Update or create attendance records
        const results = [];
        for (const record of attendanceRecords) {
          const existing = existingAttendance.find(a => a.childId === record.childId);
          
          if (existing) {
            // Update existing record
            const updated = await client.attendance.update({
              where: { id: existing.id },
              data: {
                present: record.present,
                checkInTime: record.checkInTime,
                checkOutTime: record.checkOutTime,
                notes: record.notes
              }
            });
            results.push(updated);
          } else {
            // Create new record
            const created = await client.register.create({
              data: {
                registerId,
                childId: record.childId,
                present: record.present,
                checkInTime: record.checkInTime,
                checkOutTime: record.checkOutTime,
                notes: record.notes
              }
            });
            results.push(created);
          }
        }

        // Update register statistics
        const presentCount = results.filter(r => r.present).length;
        const totalCount = results.length;

        await client.register.update({
          where: { id: registerId },
          data: {
            presentCount,
            totalCount,
            lastUpdated: new Date()
          }
        });

        logger.info('Attendance updated', {
          registerId,
          presentCount,
          totalCount
        });

        return results;
      });
    } catch (error) {
      logger.error('Failed to update attendance:', error);
      throw error;
    }
  }

  async getAttendanceStats(registerId: string) {
    try {
      return await safePrismaQuery(async (client) => {
        const register = await client.register.findUnique({
          where: { id: registerId },
          include: {
            activity: {
              select: {
                title: true
              }
            }
          }
        });

        if (!register) return null;

        const totalBookings = 0; // TODO: Get bookings count from activity
        const totalAttendance = 0; // TODO: Implement attendance tracking
        const presentCount = 0; // TODO: Implement attendance tracking
        const absentCount = totalAttendance - presentCount;
        const noShowCount = totalBookings - totalAttendance;

        return {
          totalBookings,
          totalAttendance,
          presentCount,
          absentCount,
          noShowCount,
          attendanceRate: totalBookings > 0 ? (totalAttendance / totalBookings) * 100 : 0,
          presentRate: totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0
        };
      });
    } catch (error) {
      logger.error('Failed to get attendance stats:', error);
      throw error;
    }
  }

  async generateAttendanceReport(activityId: string, dateFrom: Date, dateTo: Date) {
    try {
      return await safePrismaQuery(async (client) => {
        const registers = await client.register.findMany({
          where: {
            activityId: activityId,
            date: {
              gte: dateFrom,
              lte: dateTo
            }
          },
          include: {
            activity: {
              select: {
                title: true,
                type: true
              }
            },
          },
          orderBy: { date: 'asc' }
        });

        const report = {
          activityId,
          dateFrom,
          dateTo,
          totalSessions: registers.length,
          totalAttendance: 0, // TODO: Implement attendance tracking
          totalPresent: 0, // TODO: Implement attendance tracking
          averageAttendance: registers.length > 0 
            ? 0 // TODO: Implement attendance tracking 
            : 0,
          sessions: registers.map(register => ({
            date: register.date,
            presentCount: 0, // TODO: Implement attendance tracking
            totalCount: 0, // TODO: Implement attendance tracking
            attendanceRate: 0, // TODO: Implement attendance tracking
            children: [], // TODO: Implement attendance tracking
          }))
        };

        return report;
      });
    } catch (error) {
      logger.error('Failed to generate attendance report:', error);
      throw error;
    }
  }

  async deleteRegister(registerId: string) {
    try {
      await safePrismaQuery(async (client) => {
        // Delete attendance records first
        // TODO: Implement attendance deletion

        // Delete the register
        await client.register.delete({
          where: { id: registerId }
        });
      });

      logger.info('Register deleted', { registerId });
    } catch (error) {
      logger.error('Failed to delete register:', error);
      throw error;
    }
  }

  async autoCreateRegistersForActivity(activityId: string, startDate: Date, endDate: Date) {
    try {
      return await safePrismaQuery(async (client) => {
        // Get all sessions for the activity in the date range
        const activities = await client.activity.findMany({
          where: {
            id: activityId
          },
          select: {
            id: true,
            title: true,
            venueId: true,
            capacity: true
          }
        });

        const registers = [];
        for (const activity of activities) {
          // Check if register already exists
          const existingRegister = await client.register.findFirst({
            where: { activityId: activity.id }
          });

          if (!existingRegister) {
            const register = await client.register.create({
              data: {
                venueId: activity.venueId,
                activityId: activity.id,
                date: new Date(),
                status: 'active'
              }
            });
            registers.push(register);
          }
        }

        logger.info('Auto-created registers', {
          activityId,
          registersCreated: registers.length,
          totalActivities: activities.length
        });

        return registers;
      });
    } catch (error) {
      logger.error('Failed to auto-create registers:', error);
      throw error;
    }
  }
}

export const registerService = new RegisterService();
export default registerService;
