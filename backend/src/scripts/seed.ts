import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data (in correct order due to foreign keys)
    console.log('🧹 Clearing existing data...');
    
    await prisma.booking.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.venue.deleteMany();
    await prisma.child.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Existing data cleared');

    // Create users
    console.log('👥 Creating users...');
    
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const parentPasswordHash = await bcrypt.hash('parent123', 12);
    const staffPasswordHash = await bcrypt.hash('staff123', 12);

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@bookon.com',
        password_hash: adminPasswordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        emailVerified: true,
      },
    });

    const parentUser = await prisma.user.create({
      data: {
        email: 'parent@bookon.com',
        password_hash: parentPasswordHash,
        firstName: 'John',
        lastName: 'Smith',
        role: 'parent',
        isActive: true,
        emailVerified: true,
      },
    });

    await prisma.user.create({
      data: {
        email: 'staff@bookon.com',
        password_hash: staffPasswordHash,
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'staff',
        isActive: true,
        emailVerified: true,
      },
    });

    console.log('✅ Users created');

    // Create children
    console.log('👶 Creating children...');
    
    const child1 = await prisma.child.create({
      data: {
        firstName: 'Emma',
        lastName: 'Smith',
        dateOfBirth: new Date('2015-03-15'),
        parentId: parentUser.id,
      },
    });

    const child2 = await prisma.child.create({
      data: {
        firstName: 'Oliver',
        lastName: 'Smith',
        dateOfBirth: new Date('2017-08-22'),
        parentId: parentUser.id,
      },
    });

    console.log('✅ Children created');

    // Create venues
    console.log('🏢 Creating venues...');
    
    const venue1 = await prisma.venue.create({
      data: {
        name: 'Community Sports Center',
        address: '123 Sports Lane, London',
        description: 'Modern sports facility with multiple courts and equipment',
        capacity: 100,
        ownerId: adminUser.id,
        isActive: true,
      },
    });

    const venue2 = await prisma.venue.create({
      data: {
        name: 'Arts & Crafts Studio',
        address: '456 Creative Street, Manchester',
        description: 'Spacious studio for arts and crafts activities',
        capacity: 50,
        ownerId: adminUser.id,
        isActive: true,
      },
    });

    const venue3 = await prisma.venue.create({
      data: {
        name: 'Swimming Pool Complex',
        address: '789 Water Way, Birmingham',
        description: 'Olympic-sized pool with changing facilities',
        capacity: 200,
        ownerId: adminUser.id,
        isActive: true,
      },
    });

    console.log('✅ Venues created');

    // Create activities
    console.log('🎯 Creating activities...');
    
    const activity1 = await prisma.activity.create({
      data: {
        name: 'Football Training',
        description: 'Learn basic football skills and teamwork',
        duration: 90,
        maxCapacity: 20,
        venueId: venue1.id,
        ownerId: adminUser.id,
        isActive: true,
      },
    });

    const activity2 = await prisma.activity.create({
      data: {
        name: 'Art & Painting',
        description: 'Creative painting and drawing sessions',
        duration: 60,
        maxCapacity: 15,
        venueId: venue2.id,
        ownerId: adminUser.id,
        isActive: true,
      },
    });

    const activity3 = await prisma.activity.create({
      data: {
        name: 'Swimming Lessons',
        description: 'Learn to swim with certified instructors',
        duration: 45,
        maxCapacity: 12,
        venueId: venue3.id,
        ownerId: adminUser.id,
        isActive: true,
      },
    });

    const activity4 = await prisma.activity.create({
      data: {
        name: 'Basketball Training',
        description: 'Develop basketball skills and fitness',
        duration: 75,
        maxCapacity: 16,
        venueId: venue1.id,
        ownerId: adminUser.id,
        isActive: true,
      },
    });

    const activity5 = await prisma.activity.create({
      data: {
        name: 'Pottery Workshop',
        description: 'Hands-on pottery making and glazing',
        duration: 120,
        maxCapacity: 10,
        venueId: venue2.id,
        ownerId: adminUser.id,
        isActive: true,
      },
    });

    console.log('✅ Activities created');

    // Create bookings
    console.log('📅 Creating bookings...');
    
    await prisma.booking.create({
      data: {
        activityId: activity1.id,
        childId: child1.id,
        parentId: parentUser.id,
        status: 'confirmed',
      },
    });

    await prisma.booking.create({
      data: {
        activityId: activity2.id,
        childId: child1.id,
        parentId: parentUser.id,
        status: 'pending',
      },
    });

    await prisma.booking.create({
      data: {
        activityId: activity3.id,
        childId: child2.id,
        parentId: parentUser.id,
        status: 'confirmed',
      },
    });

    await prisma.booking.create({
      data: {
        activityId: activity4.id,
        childId: child1.id,
        parentId: parentUser.id,
        status: 'completed',
      },
    });

    await prisma.booking.create({
      data: {
        activityId: activity5.id,
        childId: child2.id,
        parentId: parentUser.id,
        status: 'cancelled',
      },
    });

    console.log('✅ Bookings created');

    // Create additional sample data for better testing
    console.log('📊 Creating additional sample data...');
    
    // Create more children for different parents
    const parent2 = await prisma.user.create({
      data: {
        email: 'sarah@bookon.com',
        password_hash: await bcrypt.hash('sarah123', 12),
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'parent',
        isActive: true,
        emailVerified: true,
      },
    });

    const child3 = await prisma.child.create({
      data: {
        firstName: 'Sophie',
        lastName: 'Johnson',
        dateOfBirth: new Date('2016-11-08'),
        parentId: parent2.id,
      },
    });

    // Create more bookings
    await prisma.booking.create({
      data: {
        activityId: activity1.id,
        childId: child3.id,
        parentId: parent2.id,
        status: 'confirmed',
      },
    });

    await prisma.booking.create({
      data: {
        activityId: activity2.id,
        childId: child3.id,
        parentId: parent2.id,
        status: 'pending',
      },
    });

    console.log('✅ Additional sample data created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`👥 Users: ${await prisma.user.count()}`);
    console.log(`👶 Children: ${await prisma.child.count()}`);
    console.log(`🏢 Venues: ${await prisma.venue.count()}`);
    console.log(`🎯 Activities: ${await prisma.activity.count()}`);
    console.log(`📅 Bookings: ${await prisma.booking.count()}`);
    
    console.log('\n🔑 Test Accounts:');
    console.log('Admin: admin@bookon.com / admin123');
    console.log('Parent: parent@bookon.com / parent123');
    console.log('Staff: staff@bookon.com / staff123');
    console.log('Parent 2: sarah@bookon.com / sarah123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
