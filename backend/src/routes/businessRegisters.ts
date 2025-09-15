import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get business registers
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { search, status, page = 1, limit = 20 } = req.query;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Get user's venues
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
    });

    const venueIds = venues.map(v => v.id);

    // Build where clause for registers
    const where: any = {
      session: {
        activity: {
          venueId: { in: venueIds }
        }
      }
    };

    if (search) {
      where.OR = [
        { 
          session: {
            activity: {
              title: { contains: search as string, mode: 'insensitive' }
            }
          }
        },
        { 
          session: {
            activity: {
              venue: {
                name: { contains: search as string, mode: 'insensitive' }
              }
            }
          }
        }
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get registers with pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const [registers, totalCount] = await safePrismaQuery(async (client) => {
      return await Promise.all([
        client.register.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            status: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            session: {
              select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
                capacity: true,
                bookingsCount: true,
                activity: {
                  select: {
                    id: true,
                    title: true,
                    type: true,
                    venue: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            },
            _count: {
              select: {
                attendance: true
              }
            }
          }
        }),
        client.register.count({ where })
      ]);
    });

    // Get summary statistics
    const stats = await safePrismaQuery(async (client) => {
      const [totalRegisters, upcoming, inProgress, completed, cancelled] = await Promise.all([
        client.register.count({ where }),
        client.register.count({ 
          where: { 
            ...where,
            status: 'upcoming' 
          } 
        }),
        client.register.count({ 
          where: { 
            ...where,
            status: 'in-progress' 
          } 
        }),
        client.register.count({ 
          where: { 
            ...where,
            status: 'completed' 
          } 
        }),
        client.register.count({ 
          where: { 
            ...where,
            status: 'cancelled' 
          } 
        })
      ]);

      return { totalRegisters, upcoming, inProgress, completed, cancelled };
    });

    res.json({
      success: true,
      data: {
        registers,
        stats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching business registers:', error);
    throw new AppError('Failed to fetch registers', 500, 'REGISTERS_FETCH_ERROR');
  }
}));

// Get single register
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Get user's venues
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
    });

    const venueIds = venues.map(v => v.id);

    const register = await safePrismaQuery(async (client) => {
      return await client.register.findFirst({
        where: { 
          id,
          session: {
            activity: {
              venueId: { in: venueIds }
            }
          }
        },
        select: {
          id: true,
          date: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          session: {
            select: {
              id: true,
              date: true,
              startTime: true,
              endTime: true,
              capacity: true,
              bookingsCount: true,
              activity: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  description: true,
                  venue: {
                    select: {
                      id: true,
                      name: true,
                      address: true
                    }
                  }
                }
              }
            }
          },
          attendance: {
            select: {
              id: true,
              present: true,
              checkInTime: true,
              checkOutTime: true,
              notes: true,
              child: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true
                }
              },
              booking: {
                select: {
                  id: true,
                  parent: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      phone: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    });

    if (!register) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: register
    });

  } catch (error) {
    logger.error('Error fetching register:', error);
    throw new AppError('Failed to fetch register', 500, 'REGISTER_FETCH_ERROR');
  }
}));

// Create register
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { sessionId, date, status = 'upcoming', notes } = req.body;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Validate required fields
    if (!sessionId || !date) {
      throw new AppError('Session ID and date are required', 400, 'VALIDATION_ERROR');
    }

    // Check if session exists and belongs to user's venue
    const session = await safePrismaQuery(async (client) => {
      return await client.session.findFirst({
        where: { 
          id: sessionId,
          activity: {
            venue: {
              ownerId: userId
            }
          }
        },
        select: {
          id: true,
          activity: {
            select: {
              title: true,
              venue: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
    });

    if (!session) {
      throw new AppError('Session not found or access denied', 404, 'SESSION_NOT_FOUND');
    }

    const register = await safePrismaQuery(async (client) => {
      return await client.register.create({
        data: {
          sessionId,
          date: new Date(date),
          status,
          notes
        },
        select: {
          id: true,
          date: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          session: {
            select: {
              id: true,
              date: true,
              startTime: true,
              endTime: true,
              capacity: true,
              bookingsCount: true,
              activity: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  venue: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    });

    res.status(201).json({
      success: true,
      data: register
    });

  } catch (error) {
    logger.error('Error creating register:', error);
    throw new AppError('Failed to create register', 500, 'REGISTER_CREATE_ERROR');
  }
}));

// Update register
router.put('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { date, status, notes } = req.body;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Get user's venues
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
    });

    const venueIds = venues.map(v => v.id);

    // Check if register exists and belongs to user's venue
    const existingRegister = await safePrismaQuery(async (client) => {
      return await client.register.findFirst({
        where: { 
          id,
          session: {
            activity: {
              venueId: { in: venueIds }
            }
          }
        }
      });
    });

    if (!existingRegister) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    const updateData: any = {};
    if (date !== undefined) updateData.date = new Date(date);
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const register = await safePrismaQuery(async (client) => {
      return await client.register.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          date: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          session: {
            select: {
              id: true,
              date: true,
              startTime: true,
              endTime: true,
              capacity: true,
              bookingsCount: true,
              activity: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  venue: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    });

    res.json({
      success: true,
      data: register
    });

  } catch (error) {
    logger.error('Error updating register:', error);
    throw new AppError('Failed to update register', 500, 'REGISTER_UPDATE_ERROR');
  }
}));

// Delete register
router.delete('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Get user's venues
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
    });

    const venueIds = venues.map(v => v.id);

    // Check if register exists and belongs to user's venue
    const existingRegister = await safePrismaQuery(async (client) => {
      return await client.register.findFirst({
        where: { 
          id,
          session: {
            activity: {
              venueId: { in: venueIds }
            }
          }
        },
        include: {
          _count: {
            select: {
              attendance: true
            }
          }
        }
      });
    });

    if (!existingRegister) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    // Check if register has attendance records
    if (existingRegister._count.attendance > 0) {
      throw new AppError('Cannot delete register with attendance records', 400, 'REGISTER_HAS_ATTENDANCE');
    }

    await safePrismaQuery(async (client) => {
      return await client.register.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: 'Register deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting register:', error);
    throw new AppError('Failed to delete register', 500, 'REGISTER_DELETE_ERROR');
  }
}));

export default router;
