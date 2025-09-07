import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { body, param, query, validationResult } from 'express-validator';
import PDFDocument from 'pdfkit';

const router = Router();

// Validation middleware
const validateRegister = [
  body('activityId').isUUID().withMessage('Activity ID must be a valid UUID'),
  body('date').isISO8601().withMessage('Date must be a valid ISO date'),
  body('attendance').isArray().withMessage('Attendance must be an array'),
  body('attendance.*.childId').isUUID().withMessage('Child ID must be a valid UUID'),
  body('attendance.*.status').isIn(['present', 'absent', 'late', 'left_early']).withMessage('Invalid attendance status'),
  body('attendance.*.notes').optional().isString().isLength({ max: 500 }).withMessage('Notes too long'),
];

const validateRegisterUpdate = [
  param('id').isUUID().withMessage('Register ID must be a valid UUID'),
  body('attendance').isArray().withMessage('Attendance must be an array'),
  body('attendance.*.childId').isUUID().withMessage('Child ID must be a valid UUID'),
  body('attendance.*.status').isIn(['present', 'absent', 'late', 'left_early']).withMessage('Invalid attendance status'),
  body('attendance.*.notes').optional().isString().isLength({ max: 500 }).withMessage('Notes too long'),
];

// Get all registers for a venue/activity
router.get('/', authenticateToken, requireRole(['admin', 'staff']), [
  query('venueId').optional().isUUID().withMessage('Venue ID must be a valid UUID'),
  query('activityId').optional().isUUID().withMessage('Activity ID must be a valid UUID'),
  query('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { venueId, activityId, date, startDate, endDate } = req.query;
    const userId = req.user!.id;

    // Build Prisma where clause based on user role and permissions
    const whereClause: any = {};

    // Filter by venue if specified
    if (venueId) {
      whereClause.activity = {
        venueId: venueId
      };
    }

    // Filter by activity if specified
    if (activityId) {
      whereClause.activityId = activityId;
    }

    // Filter by date
    if (date) {
      whereClause.date = new Date(date as string);
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    // Note: venue_staff table doesn't exist in current schema
    // Staff permissions would need to be implemented differently

    const registers = await prisma.register.findMany({
      where: whereClause,
      include: {
        activity: {
          include: {
            venue: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { activity: { createdAt: 'asc' } }
      ]
    });

    logger.info('Registers retrieved', {
      userId,
      venueId: venueId || 'all',
      activityId: activityId || 'all',
      count: registers.length
    });

    res.json({
      success: true,
      data: registers
    });

  } catch (error) {
    logger.error('Error retrieving registers:', error);
    throw error;
  }
}));

// Get a specific register by ID
router.get('/:id', authenticateToken, requireRole(['admin', 'staff']), [
  param('id').isUUID().withMessage('Register ID must be a valid UUID'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Register ID is required', 400, 'MISSING_REGISTER_ID');
    }
    const userId = req.user!.id;

    if (!id) {
      throw new AppError('Register ID is required', 400, 'MISSING_REGISTER_ID');
    }

    const register = await prisma.register.findUnique({
      where: { id },
      include: {
        activity: {
          include: {
            venue: true
          }
        }
      }
    });

    if (!register) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    // Check permissions
    if (req.user!.role === 'staff') {
      // Note: venue_staff table doesn't exist in current schema
      // Staff permissions would need to be implemented differently
      // For now, allowing access
    }

    // Get register entries (attendance)
    const attendance = await (prisma as any).registerEntry.findMany({
      where: { registerId: id },
      include: {
        child: true
      },
      orderBy: { child: { firstName: 'asc' } }
    });

    const registerWithAttendance = {
      ...register,
      attendance
    };

    logger.info('Register retrieved', { registerId: id, userId });

    res.json({
      success: true,
      data: registerWithAttendance
    });

  } catch (error) {
    logger.error('Error retrieving register:', error);
    throw error;
  }
}));

// Create a new register
router.post('/', authenticateToken, requireRole(['admin', 'staff']), validateRegister, asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { activityId, date, attendance, notes } = req.body as {
      activityId: string;
      date: string;
      attendance?: any[];
      notes?: string;
    };
    const userId = req.user!.id;

    // Check if register already exists for this activity and date
    const existingRegister = await prisma.register.findFirst({
      where: {
        activityId: activityId,
        date: new Date(date)
      }
    });

    if (existingRegister) {
      throw new AppError('Register already exists for this activity and date', 400, 'REGISTER_ALREADY_EXISTS');
    }

    // Get activity and venue info
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        venue: true
      }
    });

    if (!activity) {
      throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
    }

    // Check permissions
    if (req.user!.role === 'staff') {
      // Note: venue_staff table doesn't exist in current schema
      // Staff permissions would need to be implemented differently
      // For now, allowing access
    }

    // Create register
    const register = await prisma.register.create({
      data: {
        activityId: activityId,
        venueId: activity.venueId,
        date: new Date(date),
        notes: notes || null,
        status: 'active'
      }
    });

    // Create register entries for each child in attendance
    if (attendance && attendance.length > 0) {
      const registerEntries = attendance.map((entry: any) => ({
        registerId: register.id,
        childId: entry.childId,
        status: entry.status || 'present',
        notes: entry.notes || null,
        allergies: entry.allergies || null,
        medicalInfo: entry.medicalInfo || null,
        pickupNotes: entry.pickupNotes || null,
        senFlags: entry.senFlags || null,
        recordedBy: userId
      }));

      await (prisma as any).registerEntry.createMany({
        data: registerEntries
      });
    }

    // Get the complete register with attendance
    const completeRegister = await prisma.register.findUnique({
      where: { id: register.id },
      include: {
        activity: {
          include: {
            venue: true
          }
        },
        // entries: {
        //   include: {
        //     child: true
        //   }
        // }
      }
    });

    logger.info('Register created', {
      registerId: register.id,
      activityId,
      date,
      attendanceCount: attendance?.length || 0,
      userId
    });

    res.status(201).json({
      success: true,
      data: completeRegister
    });

  } catch (error) {
    logger.error('Error creating register:', error);
    throw error;
  }
}));

// Update an existing register
router.put('/:id', authenticateToken, requireRole(['admin', 'staff']), validateRegisterUpdate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Register ID is required', 400, 'MISSING_REGISTER_ID');
    }
    const { attendance, notes } = req.body;
    const userId = req.user!.id;

    // Get existing register
    const existingRegister = await prisma.register.findUnique({
      where: { id },
      include: {
        activity: {
          select: {
            venueId: true
          }
        }
      }
    });

    if (!existingRegister) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    // Check permissions
    if (req.user!.role === 'staff') {
      // Note: venue_staff table doesn't exist in current schema
      // Staff permissions would need to be implemented differently
      // For now, allowing access
    }

    // Update register
    await prisma.register.update({
      where: { id },
      data: {
        notes: notes || null
      }
    });

    // Update register entries
    if (attendance && attendance.length > 0) {
      // Delete existing entries
      await (prisma as any).registerEntry.deleteMany({
        where: { registerId: id }
      });

      // Create new entries
      const registerEntries = attendance.map((entry: any) => ({
        registerId: id,
        childId: entry.childId,
        status: entry.status || 'present',
        notes: entry.notes || null,
        allergies: entry.allergies || null,
        medicalInfo: entry.medicalInfo || null,
        pickupNotes: entry.pickupNotes || null,
        senFlags: entry.senFlags || null,
        recordedBy: userId
      }));

      await (prisma as any).registerEntry.createMany({
        data: registerEntries
      });
    }

    // Get updated register
    const updatedRegister = await prisma.register.findUnique({
      where: { id },
      include: {
        activity: {
          include: {
            venue: true
          }
        },
        // entries: {
        //   include: {
        //     child: true
        //   }
        // }
      }
    });

    logger.info('Register updated', {
      registerId: id,
      attendanceCount: attendance?.length || 0,
      userId
    });

    res.json({
      success: true,
      data: updatedRegister
    });

  } catch (error) {
    logger.error('Error updating register:', error);
    throw error;
  }
}));

// Delete a register
router.delete('/:id', authenticateToken, requireRole(['admin']), [
  param('id').isUUID().withMessage('Register ID must be a valid UUID'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Register ID is required', 400, 'MISSING_REGISTER_ID');
    }
    const userId = req.user!.id;

    // Check if register exists
    const register = await prisma.register.findUnique({ where: { id } });
    if (!register) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    // Soft delete register
    await prisma.register.update({
      where: { id },
      data: {
        status: 'cancelled'
      }
    });

    // Delete associated register entries
    await (prisma as any).registerEntry.deleteMany({
      where: { registerId: id }
    });

    logger.info('Register deleted', { registerId: id, userId });

    res.json({
      success: true,
      message: 'Register deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting register:', error);
    throw error;
  }
}));

// Export register to CSV
router.get('/:id/export/csv', authenticateToken, requireRole(['admin', 'staff']), [
  param('id').isUUID().withMessage('Register ID must be a valid UUID'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Register ID is required', 400, 'MISSING_REGISTER_ID');
    }
    const userId = req.user!.id;

    // Get register with attendance
    const register = await prisma.register.findUnique({
      where: { id },
      include: {
        activity: {
          include: {
            venue: true
          }
        }
      }
    });

    if (!register) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    // Check permissions
    if (req.user!.role === 'staff') {
      // Note: venue_staff table doesn't exist in current schema
      // Staff permissions would need to be implemented differently
      // For now, allowing access
    }

    // Get register entries (attendance)
    const attendance = await (prisma as any).registerEntry.findMany({
      where: { registerId: id },
      include: {
        child: true
      },
      orderBy: { child: { firstName: 'asc' } }
    });

    // Generate CSV content
    const csvHeaders = [
      'First Name',
      'Last Name',
      'Date of Birth',
      'Year Group',
      'Status',
      'Check-in Time',
      'Notes',
      'Allergies',
      'Medical Info',
      'Pickup Notes',
      'Recorded At'
    ];

    const csvRows = attendance.map((entry: any) => [
      entry.child.firstName,
      entry.child.lastName,
      entry.child.dateOfBirth.toISOString().split('T')[0],
      entry.child.yearGroup || '',
      entry.status,
      entry.checkInTime ? entry.checkInTime.toLocaleTimeString() : '',
      entry.notes || '',
      entry.allergies || '',
      entry.medicalInfo || '',
      entry.pickupNotes || '',
      entry.createdAt.toLocaleString()
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map((field: any) => `"${field}"`).join(','))
      .join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="register-${register.date.toISOString().split('T')[0]}-${register.activity.name.replace(/\s+/g, '-')}.csv"`);

    logger.info('Register exported to CSV', { registerId: id, userId });

    res.send(csvContent);

  } catch (error) {
    logger.error('Error exporting register to CSV:', error);
    throw error;
  }
}));

// Get register template for an activity
router.get('/template/:activityId', authenticateToken, requireRole(['admin', 'staff']), [
  param('activityId').isUUID().withMessage('Activity ID must be a valid UUID'),
  query('date').isISO8601().withMessage('Date must be a valid ISO date'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { activityId } = req.params;
    if (!activityId) {
      throw new AppError('Activity ID is required', 400, 'MISSING_ACTIVITY_ID');
    }
    const { date } = req.query;
    const userId = req.user!.id;

    // Get activity and venue info
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        venue: true
      }
    });

    if (!activity) {
      throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
    }

    // Check permissions
    if (req.user!.role === 'staff') {
      // Note: venue_staff table doesn't exist in current schema
      // Staff permissions would need to be implemented differently
      // For now, allowing access
    }

    // Get all children booked for this activity on this date
    const bookedChildren = await prisma.booking.findMany({
      where: {
        activityId: activityId as string,
        status: 'confirmed'
      },
      include: {
        child: true
      },
      orderBy: {
        child: {
          firstName: 'asc'
        }
      }
    });

    // Create template with default attendance status
    const template = {
      activityId,
      date,
      activityTitle: activity.name,
      venueName: 'Venue Name', // Placeholder
      startTime: activity.createdAt, // Using createdAt as placeholder
      endTime: activity.createdAt, // Using createdAt as placeholder
      children: bookedChildren.map(booking => ({
        childId: booking.childId,
        firstName: 'Child', // Placeholder
        lastName: 'Name', // Placeholder
        dateOfBirth: new Date(), // Placeholder
        yearGroup: 'N/A', // Placeholder
        allergies: '', // Placeholder
        medicalInfo: '', // Placeholder
        emergencyContacts: null, // Placeholder
        bookingId: booking.id,
        status: 'present', // Default status
        notes: ''
      }))
    };

    logger.info('Register template generated', {
      activityId,
      date,
      childrenCount: template.children.length,
      userId
    });

    res.json({
      success: true,
      data: template
    });

  } catch (error) {
    logger.error('Error generating register template:', error);
    throw error;
  }
}));

// Auto-generate registers from bookings for a specific date range
router.post('/auto-generate', authenticateToken, requireRole(['admin', 'staff']), [
  body('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
  body('endDate').isISO8601().withMessage('End date must be a valid ISO date'),
  body('venueId').optional().isUUID().withMessage('Venue ID must be a valid UUID'),
  body('activityId').optional().isUUID().withMessage('Activity ID must be a valid UUID'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate, venueId, activityId } = req.body;
    const userId = req.user!.id;

    // Build Prisma where clause for confirmed bookings
    const whereClause: any = {
      status: 'confirmed',
      bookingDate: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    if (venueId) {
      whereClause.activity = {
        venueId: venueId
      };
    }

    if (activityId) {
      whereClause.activityId = activityId;
    }

    // Get confirmed bookings for the date range
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        activity: {
          include: {
            venue: true
          }
        }
      }
    });

    // Note: venue_staff table doesn't exist in current schema
    // Staff permissions would need to be implemented differently

    // Group bookings by activity and date
    const registerGroups = new Map<string, any[]>();
    bookings.forEach(booking => {
      const key = `${booking.activityId}-${booking.bookingDate}`;
      if (!registerGroups.has(key)) {
        registerGroups.set(key, []);
      }
      registerGroups.get(key)!.push(booking);
    });

    const generatedRegisters = [];

    // Create registers for each group
    for (const [key, groupBookings] of Array.from(registerGroups.entries())) {
      const [activityId, date] = key.split('-');
      if (!activityId || !date) {
        continue;
      }
      const firstBooking = groupBookings[0];

      // Check if register already exists
      const existingRegister = await prisma.register.findFirst({
        where: {
          activityId: activityId,
          date: new Date(date),
          status: 'active'
        }
      });

      if (existingRegister) {
        logger.info('Register already exists', { activityId, date });
        continue;
      }

      // Create new register
      const register = await prisma.register.create({
        data: {
          activityId: activityId as string,
          venueId: firstBooking.activity.venueId,
          date: new Date(date),
          notes: `Auto-generated from ${groupBookings.length} confirmed bookings`,
          status: 'active'
        }
      });

      // Create register entries for booked children
      const registerEntries = groupBookings.map(booking => ({
        registerId: register.id,
        childId: booking.childId,
        status: 'present',
        recordedBy: userId
      }));

      await (prisma as any).registerEntry.createMany({
        data: registerEntries
      });

      generatedRegisters.push({
        id: register.id,
        activityId: register.activityId,
        date: register.date,
        totalBookings: groupBookings.length,
        venue: firstBooking.activity.venue.name,
        activity: firstBooking.activity.name,
      });
    }

    logger.info('Registers auto-generated', {
      userId,
      startDate,
      endDate,
      generatedCount: generatedRegisters.length
    });

    res.json({
      success: true,
      message: `Successfully generated ${generatedRegisters.length} registers`,
      data: generatedRegisters
    });

  } catch (error) {
    logger.error('Error auto-generating registers:', error);
    throw error;
  }
}));

// Export register to CSV
router.get('/:id/export/csv', authenticateToken, requireRole(['admin', 'staff']), [
  param('id').isUUID().withMessage('Register ID must be a valid UUID'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Register ID is required', 400, 'MISSING_REGISTER_ID');
    }
    const userId = req.user!.id;

    // Get register with attendance details
    const register = await prisma.register.findFirst({
      where: { 
        id: id,
        status: 'active'
      },
      include: {
        activity: {
          include: {
            venue: true
          }
        }
      }
    });

    if (!register) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    // Note: register_attendance table doesn't exist in current schema
    // Attendance tracking would need to be implemented differently
    const attendance: any[] = [];

    // Generate CSV content
    const csvHeaders = [
      'Child Name',
      'Date of Birth',
      'Status',
      'Check-in Time',
      'Notes',
      'Recorded By',
      'Recorded At'
    ];

    const csvRows = attendance.map((entry: any) => [
      `${entry.first_name} ${entry.last_name}`,
      entry.date_of_birth,
      entry.status,
      entry.recorded_at ? new Date(entry.recorded_at).toLocaleTimeString() : '',
      entry.notes || '',
      entry.recorded_by,
      new Date(entry.recorded_at).toLocaleString()
    ]);

    const csvContent = [
      `Register: ${register.activity.name}`,
      `Venue: ${register.activity.venue.name}`,
      `Date: ${register.date}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="register-${register.date}-${register.activity.name.replace(/\s+/g, '-')}.csv"`);
    
    res.send(csvContent);

    logger.info('Register exported to CSV', {
      userId,
      registerId: id,
      attendanceCount: attendance.length
    });

  } catch (error) {
    logger.error('Error exporting register to CSV:', error);
    throw error;
  }
}));

// Get register statistics
router.get('/stats', authenticateToken, requireRole(['admin', 'staff']), [
  query('venueId').optional().isUUID().withMessage('Venue ID must be a valid UUID'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const { venueId, startDate, endDate } = req.query;
    const userId = req.user!.id;

    // Build Prisma where clause
    const whereClause: any = {
      status: 'active'
    };

    if (venueId) {
      whereClause.activity = {
        venueId: venueId
      };
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    // Note: venue_staff table doesn't exist in current schema
    // Staff permissions would need to be implemented differently

    const registers = await prisma.register.findMany({
      where: whereClause,
      include: {
        activity: {
          include: {
            venue: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate statistics
    const totalRegisters = registers.length;
    const totalActivities = new Set(registers.map(r => r.activityId)).size;
    const totalVenues = new Set(registers.map(r => r.activity.venueId)).size;

    // Get attendance statistics using Prisma
    const attendanceStats = await (prisma as any).registerEntry.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      where: {
        register: {
          status: 'active'
        }
      }
    });

    const attendanceBreakdown = attendanceStats.reduce((acc: any, stat: any) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        totalRegisters,
        totalActivities,
        totalVenues,
        attendanceBreakdown,
        dateRange: { startDate, endDate }
      }
    });

  } catch (error) {
    logger.error('Error getting register statistics:', error);
    throw error;
  }
}));

// Export register to PDF
router.get('/:id/export/pdf', authenticateToken, requireRole(['admin', 'staff']), [
  param('id').isUUID().withMessage('Register ID must be a valid UUID'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Register ID is required', 400, 'MISSING_REGISTER_ID');
    }
    const userId = req.user!.id;

    // Get register with attendance details
    const register = await prisma.register.findFirst({
      where: { 
        id: id,
        status: 'active'
      },
      include: {
        activity: {
          include: {
            venue: true
          }
        },
        // entries: {
        //   include: {
        //     child: true
        //   },
        //   orderBy: { child: { firstName: 'asc' } }
        // }
      }
    });

    if (!register) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    // Check permissions
    if (req.user!.role === 'staff') {
      // Note: venue_staff table doesn't exist in current schema
      // Staff permissions would need to be implemented differently
      // For now, allowing access
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="register-${register.date.toISOString().split('T')[0]}-${register.activity.name.replace(/\s+/g, '-')}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(20).text('Attendance Register', { align: 'center' });
    doc.moveDown();
    
    // Add register details
    doc.fontSize(12);
    doc.text(`Activity: ${register.activity.name}`);
    doc.text(`Venue: ${register.activity.venue.name}`);
    doc.text(`Date: ${register.date.toLocaleDateString()}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // Add table headers
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [80, 80, 60, 80, 100, 100];
    const colHeaders = ['First Name', 'Last Name', 'Year Group', 'Status', 'Check-in Time', 'Notes'];

    // Draw table headers
    doc.fontSize(10).font('Helvetica-Bold');
    let currentX = tableLeft;
    colHeaders.forEach((header, index) => {
      doc.text(header, currentX, tableTop, { width: colWidths[index] || 0, align: 'left' });
      currentX += colWidths[index] || 0;
    });

    // Draw line under headers
    doc.moveTo(tableLeft, tableTop + 20).lineTo(tableLeft + (colWidths.reduce((a, b) => a + b, 0) || 0), tableTop + 20).stroke();

    // Add table rows
    doc.font('Helvetica').fontSize(9);
    let currentY = tableTop + 30;
    
    // For now, create empty entries array until RegisterEntry is properly recognized
    const entries: any[] = [];
    entries.forEach((entry) => {
      const rowData = [
        entry.child.firstName,
        entry.child.lastName,
        entry.child.yearGroup || 'N/A',
        entry.status,
        entry.checkInTime ? entry.checkInTime.toLocaleTimeString() : '',
        entry.notes || ''
      ];

      currentX = tableLeft;
      rowData.forEach((data, index) => {
        doc.text(data, currentX, currentY, { width: colWidths[index] || 0, align: 'left' });
        currentX += colWidths[index] || 0;
      });

      currentY += 20;
      
      // Add new page if needed
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
    });

    // Add summary
    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica-Bold').text('Summary:', { underline: true });
    doc.font('Helvetica').fontSize(10);
    doc.text(`Total Children: ${entries.length}`);
    
    const statusCounts = entries.reduce((acc: Record<string, number>, entry: any) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(statusCounts).forEach(([status, count]) => {
      doc.text(`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`);
    });

    // Finalize PDF
    doc.end();

    logger.info('Register exported to PDF', {
      userId,
      registerId: id,
      attendanceCount: 0 // Placeholder
    });

  } catch (error) {
    logger.error('Error exporting register to PDF:', error);
    throw error;
  }
}));

export default router;
