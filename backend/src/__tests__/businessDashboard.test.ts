import request from 'supertest';
import app from '../index';
import { prisma } from '../utils/prisma';

describe('Business Dashboard API', () => {
  let businessUser: any;
  let businessToken: string;

  beforeAll(async () => {
    // Create a test business user
    businessUser = await prisma.user.create({
      data: {
        email: 'business@test.com',
        password_hash: 'hashed_password',
        firstName: 'Business',
        lastName: 'Owner',
        role: 'business',
        businessName: 'Test Business',
        isActive: true,
        emailVerified: true,
      },
    });

    // Create a test venue for the business
    await prisma.venue.create({
      data: {
        name: 'Test Venue',
        address: '123 Test Street',
        ownerId: businessUser.id,
        isActive: true,
      },
    });

    // Generate a test token (simplified for testing)
    businessToken = 'test-business-token';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.venue.deleteMany({
      where: { ownerId: businessUser.id },
    });
    await prisma.user.delete({
      where: { id: businessUser.id },
    });
  });

  describe('GET /api/v1/dashboard/business', () => {
    it('should return business dashboard data for business users', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/business')
        .set('Authorization', `Bearer ${businessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data).toHaveProperty('upcomingActivities');
      expect(response.body.data).toHaveProperty('financeData');
      expect(response.body.data).toHaveProperty('notifications');
      expect(response.body.data).toHaveProperty('unreadNotifications');

      // Check stats structure
      expect(response.body.data.stats).toHaveProperty('activitiesRunningToday');
      expect(response.body.data.stats).toHaveProperty('childrenInActivities');
      expect(response.body.data.stats).toHaveProperty('parentsRegistered');
      expect(response.body.data.stats).toHaveProperty('paymentsCollectedToday');
      expect(response.body.data.stats).toHaveProperty('refundsCreditsIssued');
      expect(response.body.data.stats).toHaveProperty('totalRevenue');
      expect(response.body.data.stats).toHaveProperty('monthlyGrowth');
      expect(response.body.data.stats).toHaveProperty('activeVenues');
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/v1/dashboard/business')
        .expect(401);
    });

    it('should return 403 for non-business users', async () => {
      // Create a parent user
      const parentUser = await prisma.user.create({
        data: {
          email: 'parent@test.com',
          password_hash: 'hashed_password',
          firstName: 'Parent',
          lastName: 'User',
          role: 'parent',
          isActive: true,
          emailVerified: true,
        },
      });

      const parentToken = 'test-parent-token';

      await request(app)
        .get('/api/v1/dashboard/business')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(403);

      // Clean up
      await prisma.user.delete({
        where: { id: parentUser.id },
      });
    });
  });
});
