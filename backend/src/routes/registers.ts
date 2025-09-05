import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { db } from '../utils/database';
import { logger } from '../utils/logger';
import { body, param, query, validationResult } from 'express-validator';

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

    // Build query based on user role and permissions
    let query = db('registers')
      .select(
        'registers.*',
        'activities.title as activity_title',
        'activities.start_date',
        'activities.start_time',
        'venues.name as venue_name'
      )
      .join('activities', 'registers.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id');

    // Filter by venue if specified
    if (venueId) {
      query = query.where('activities.venue_id', venueId);
    }

    // Filter by activity if specified
    if (activityId) {
      query = query.where('registers.activity_id', activityId);
    }

    // Filter by date
    if (date) {
      query = query.where('registers.date', date);
    } else if (startDate && endDate) {
      query = query.whereBetween('registers.date', [startDate, endDate]);
    }

    // Filter by user permissions
    if (req.user!.role === 'staff') {
      // Staff can only see registers for venues they have access to
      query = query.join('venue_staff', 'venues.id', 'venue_staff.venue_id')
        .where('venue_staff.user_id', userId);
    }

    const registers = await query
      .orderBy('registers.date', 'desc')
      .orderBy('activities.start_time', 'asc');

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
    const userId = req.user!.id;

    const register = await db('registers')
      .select(
        'registers.*',
        'activities.title as activity_title',
        'activities.start_date',
        'activities.start_time',
        'activities.end_time',
        'venues.name as venue_name',
        'venues.address as venue_address'
      )
      .join('activities', 'registers.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id')
      .where('registers.id', id)
      .first();

    if (!register) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    // Check permissions
    if (req.user!.role === 'staff') {
      const hasAccess = await db('venue_staff')
        .where('venue_id', register.venue_id)
        .where('user_id', userId)
        .first();
      
      if (!hasAccess) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }
    }

    // Get attendance details
    const attendance = await db('register_attendance')
      .select(
        'register_attendance.*',
        'children.first_name',
        'children.last_name',
        'children.date_of_birth',
        'children.year_group',
        'children.allergies',
        'children.medical_info'
      )
      .join('children', 'register_attendance.child_id', 'children.id')
      .where('register_attendance.register_id', id)
      .orderBy('children.first_name');

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

    const { activityId, date, attendance, notes } = req.body;
    const userId = req.user!.id;

    // Check if register already exists for this activity and date
    const existingRegister = await db('registers')
      .where('activity_id', activityId)
      .where('date', date)
      .first();

    if (existingRegister) {
      throw new AppError('Register already exists for this activity and date', 400, 'REGISTER_ALREADY_EXISTS');
    }

    // Get activity and venue info
    const activity = await db('activities')
      .select('activities.*', 'venues.id as venue_id', 'venues.name as venue_name')
      .join('venues', 'activities.venue_id', 'venues.id')
      .where('activities.id', activityId)
      .first();

    if (!activity) {
      throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
    }

    // Check permissions
    if (req.user!.role === 'staff') {
      const hasAccess = await db('venue_staff')
        .where('venue_id', activity.venue_id)
        .where('user_id', userId)
        .first();
      
      if (!hasAccess) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }
    }

    // Create register
    const [register] = await db('registers')
      .insert({
        activity_id: activityId,
        date,
        notes: notes || null,
        created_by: userId,
        is_active: true
      })
      .returning(['id', 'activity_id', 'date', 'created_at']);

    // Create attendance records
    const attendanceRecords = attendance.map((record: any) => ({
      register_id: register.id,
      child_id: record.childId,
      status: record.status,
      notes: record.notes || null,
      recorded_by: userId,
      recorded_at: new Date()
    }));

    await db('register_attendance').insert(attendanceRecords);

    // Get the complete register with attendance
    const completeRegister = await db('registers')
      .select(
        'registers.*',
        'activities.title as activity_title',
        'venues.name as venue_name'
      )
      .join('activities', 'registers.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id')
      .where('registers.id', register.id)
      .first();

    logger.info('Register created', {
      registerId: register.id,
      activityId,
      date,
      attendanceCount: attendance.length,
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
    const { attendance, notes } = req.body;
    const userId = req.user!.id;

    // Get existing register
    const existingRegister = await db('registers')
      .select('registers.*', 'activities.venue_id')
      .join('activities', 'registers.activity_id', 'activities.id')
      .where('registers.id', id)
      .first();

    if (!existingRegister) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    // Check permissions
    if (req.user!.role === 'staff') {
      const hasAccess = await db('venue_staff')
        .where('venue_id', existingRegister.venue_id)
        .where('user_id', userId)
        .first();
      
      if (!hasAccess) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }
    }

    // Update register
    await db('registers')
      .where('id', id)
      .update({
        notes: notes || null,
        updated_by: userId,
        updated_at: new Date()
      });

    // Update attendance records
    for (const record of attendance) {
      await db('register_attendance')
        .where('register_id', id)
        .where('child_id', record.childId)
        .update({
          status: record.status,
          notes: record.notes || null,
          updated_by: userId,
          updated_at: new Date()
        });
    }

    // Get updated register
    const updatedRegister = await db('registers')
      .select(
        'registers.*',
        'activities.title as activity_title',
        'venues.name as venue_name'
      )
      .join('activities', 'registers.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id')
      .where('registers.id', id)
      .first();

    logger.info('Register updated', {
      registerId: id,
      attendanceCount: attendance.length,
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
    const userId = req.user!.id;

    // Check if register exists
    const register = await db('registers').where('id', id).first();
    if (!register) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    // Soft delete register and attendance
    await db('registers')
      .where('id', id)
      .update({
        is_active: false,
        deleted_by: userId,
        deleted_at: new Date()
      });

    await db('register_attendance')
      .where('register_id', id)
      .update({
        is_active: false,
        deleted_by: userId,
        deleted_at: new Date()
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
    const userId = req.user!.id;

    // Get register with attendance
    const register = await db('registers')
      .select(
        'registers.*',
        'activities.title as activity_title',
        'activities.start_date',
        'activities.start_time',
        'activities.end_time',
        'venues.name as venue_name'
      )
      .join('activities', 'registers.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id')
      .where('registers.id', id)
      .first();

    if (!register) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    // Check permissions
    if (req.user!.role === 'staff') {
      const hasAccess = await db('venue_staff')
        .where('venue_id', register.venue_id)
        .where('user_id', userId)
        .first();
      
      if (!hasAccess) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }
    }

    // Get attendance details
    const attendance = await db('register_attendance')
      .select(
        'register_attendance.status',
        'register_attendance.notes',
        'register_attendance.recorded_at',
        'children.first_name',
        'children.last_name',
        'children.date_of_birth',
        'children.year_group',
        'children.allergies',
        'children.medical_info'
      )
      .join('children', 'register_attendance.child_id', 'children.id')
      .where('register_attendance.register_id', id)
      .orderBy('children.first_name');

    // Generate CSV content
    const csvHeaders = [
      'First Name',
      'Last Name',
      'Date of Birth',
      'Year Group',
      'Status',
      'Notes',
      'Allergies',
      'Medical Info',
      'Recorded At'
    ];

    const csvRows = attendance.map(record => [
      record.first_name,
      record.last_name,
      record.date_of_birth,
      record.year_group || '',
      record.status,
      record.notes || '',
      record.allergies || '',
      record.medical_info || '',
      record.recorded_at
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="register-${register.date}-${register.activity_title}.csv"`);

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
    const { date } = req.query;
    const userId = req.user!.id;

    // Get activity and venue info
    const activity = await db('activities')
      .select('activities.*', 'venues.id as venue_id', 'venues.name as venue_name')
      .join('venues', 'activities.venue_id', 'venues.id')
      .where('activities.id', activityId)
      .first();

    if (!activity) {
      throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
    }

    // Check permissions
    if (req.user!.role === 'staff') {
      const hasAccess = await db('venue_staff')
        .where('venue_id', activity.venue_id)
        .where('user_id', userId)
        .first();
      
      if (!hasAccess) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }
    }

    // Get all children booked for this activity on this date
    const bookedChildren = await db('bookings')
      .select(
        'children.id',
        'children.first_name',
        'children.last_name',
        'children.date_of_birth',
        'children.year_group',
        'children.allergies',
        'children.medical_info',
        'bookings.id as booking_id'
      )
      .join('children', 'bookings.child_id', 'children.id')
      .where('bookings.activity_id', activityId)
      .where('bookings.status', 'confirmed')
      .where('bookings.is_active', true)
      .orderBy('children.first_name');

    // Create template with default attendance status
    const template = {
      activityId,
      date,
      activityTitle: activity.title,
      venueName: activity.venue_name,
      startTime: activity.start_time,
      endTime: activity.end_time,
      children: bookedChildren.map(child => ({
        childId: child.id,
        firstName: child.first_name,
        lastName: child.last_name,
        dateOfBirth: child.date_of_birth,
        yearGroup: child.year_group,
        allergies: child.allergies,
        medicalInfo: child.medical_info,
        bookingId: child.booking_id,
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

    // Get confirmed bookings for the date range
    let bookingsQuery = db('bookings')
      .select(
        'bookings.activity_id',
        'bookings.booking_date',
        'activities.title as activity_title',
        'activities.start_time',
        'venues.name as venue_name',
        'venues.id as venue_id'
      )
      .join('activities', 'bookings.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id')
      .where('bookings.status', 'confirmed')
      .where('bookings.is_active', true)
      .whereBetween('bookings.booking_date', [startDate, endDate]);

    if (venueId) {
      bookingsQuery = bookingsQuery.where('activities.venue_id', venueId);
    }

    if (activityId) {
      bookingsQuery = bookingsQuery.where('bookings.activity_id', activityId);
    }

    // Filter by user permissions
    if (req.user!.role === 'staff') {
      bookingsQuery = bookingsQuery.join('venue_staff', 'venues.id', 'venue_staff.venue_id')
        .where('venue_staff.user_id', userId);
    }

    const bookings = await bookingsQuery;

    // Group bookings by activity and date
    const registerGroups = new Map<string, any[]>();
    bookings.forEach(booking => {
      const key = `${booking.activity_id}-${booking.booking_date}`;
      if (!registerGroups.has(key)) {
        registerGroups.set(key, []);
      }
      registerGroups.get(key)!.push(booking);
    });

    const generatedRegisters = [];

    // Create registers for each group
    for (const [key, groupBookings] of registerGroups) {
      const [activityId, date] = key.split('-');
      const firstBooking = groupBookings[0];

      // Check if register already exists
      const existingRegister = await db('registers')
        .where('activity_id', activityId)
        .where('date', date)
        .where('is_active', true)
        .first();

      if (existingRegister) {
        logger.info('Register already exists', { activityId, date });
        continue;
      }

      // Create new register
      const [register] = await db('registers')
        .insert({
          activity_id: activityId,
          date: date,
          notes: `Auto-generated from ${groupBookings.length} confirmed bookings`,
          created_by: userId,
          is_active: true,
        })
        .returning(['id', 'activity_id', 'date']);

      // Create attendance entries for each booking
      const attendanceEntries = groupBookings.map(booking => ({
        register_id: register.id,
        child_id: booking.child_id,
        status: 'present', // Default to present
        recorded_by: userId,
        is_active: true,
      }));

      await db('register_attendance').insert(attendanceEntries);

      generatedRegisters.push({
        id: register.id,
        activityId: register.activity_id,
        date: register.date,
        totalBookings: groupBookings.length,
        venue: firstBooking.venue_name,
        activity: firstBooking.activity_title,
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
    const userId = req.user!.id;

    // Get register with attendance details
    const register = await db('registers')
      .select(
        'registers.*',
        'activities.title as activity_title',
        'activities.start_time',
        'venues.name as venue_name'
      )
      .join('activities', 'registers.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id')
      .where('registers.id', id)
      .where('registers.is_active', true)
      .first();

    if (!register) {
      throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
    }

    // Get attendance entries
    const attendance = await db('register_attendance')
      .select(
        'register_attendance.*',
        'children.first_name',
        'children.last_name',
        'children.date_of_birth'
      )
      .join('children', 'register_attendance.child_id', 'children.id')
      .where('register_attendance.register_id', id)
      .where('register_attendance.is_active', true)
      .orderBy('children.last_name')
      .orderBy('children.first_name');

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

    const csvRows = attendance.map(entry => [
      `${entry.first_name} ${entry.last_name}`,
      entry.date_of_birth,
      entry.status,
      entry.recorded_at ? new Date(entry.recorded_at).toLocaleTimeString() : '',
      entry.notes || '',
      entry.recorded_by,
      new Date(entry.recorded_at).toLocaleString()
    ]);

    const csvContent = [
      `Register: ${register.activity_title}`,
      `Venue: ${register.venue_name}`,
      `Date: ${register.date}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="register-${register.date}-${register.activity_title.replace(/\s+/g, '-')}.csv"`);
    
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

    let query = db('registers')
      .select(
        'registers.id',
        'registers.date',
        'activities.title as activity_title',
        'venues.name as venue_name'
      )
      .join('activities', 'registers.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id')
      .where('registers.is_active', true);

    if (venueId) {
      query = query.where('activities.venue_id', venueId);
    }

    if (startDate && endDate) {
      query = query.whereBetween('registers.date', [startDate, endDate]);
    }

    // Filter by user permissions
    if (req.user!.role === 'staff') {
      query = query.join('venue_staff', 'venues.id', 'venue_staff.venue_id')
        .where('venue_staff.user_id', userId);
    }

    const registers = await query;

    // Calculate statistics
    const totalRegisters = registers.length;
    const totalActivities = new Set(registers.map(r => r.activity_id)).size;
    const totalVenues = new Set(registers.map(r => r.venue_id)).size;

    // Get attendance statistics
    const attendanceStats = await db('register_attendance')
      .select(
        'register_attendance.status',
        db.raw('COUNT(*) as count')
      )
      .join('registers', 'register_attendance.register_id', 'registers.id')
      .where('register_attendance.is_active', true)
      .where('registers.is_active', true)
      .groupBy('register_attendance.status');

    const attendanceBreakdown = attendanceStats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
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

export default router;
