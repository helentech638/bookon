// User-related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'parent' | 'staff' | 'admin';
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  password_hash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  postcode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalConditions?: string;
  allergies?: string;
  dietaryRestrictions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'parent' | 'staff' | 'admin';
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'parent' | 'staff' | 'admin';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

// Child-related types
export interface Child {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  medicalConditions?: string;
  allergies?: string;
  dietaryRestrictions?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChildRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  medicalConditions?: string;
  allergies?: string;
  dietaryRestrictions?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface UpdateChildRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  medicalConditions?: string;
  allergies?: string;
  dietaryRestrictions?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

// Venue-related types
export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  capacity?: number;
  description?: string;
  facilities?: string[];
  images?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVenueRequest {
  name: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  capacity?: number;
  description?: string;
  facilities?: string[];
  images?: string[];
}

export interface UpdateVenueRequest {
  name?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  capacity?: number;
  description?: string;
  facilities?: string[];
  images?: string[];
}

// Activity-related types
export interface Activity {
  id: string;
  venueId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
  price: number;
  ageMin?: number;
  ageMax?: number;
  category: string;
  tags?: string[];
  images?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateActivityRequest {
  venueId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  price: number;
  ageMin?: number;
  ageMax?: number;
  category: string;
  tags?: string[];
  images?: string[];
}

export interface UpdateActivityRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  maxCapacity?: number;
  price?: number;
  ageMin?: number;
  ageMax?: number;
  category?: string;
  tags?: string[];
  images?: string[];
}

// Booking-related types
export interface Booking {
  id: string;
  activityId: string;
  childId: string;
  parentId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  notes?: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  bookedAt: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingRequest {
  activityId: string;
  childId: string;
  notes?: string;
}

export interface UpdateBookingRequest {
  notes?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
}

export interface BookingWithDetails extends Booking {
  activity: Activity;
  child: Child;
  parent: User;
  venue: Venue;
}

// Payment-related types
export interface Payment {
  id: string;
  bookingId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  platformFee: number;
  stripeFee: number;
  netAmount: number;
  refundedAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentIntentRequest {
  bookingId: string;
  amount: number;
  currency?: string;
  venueId?: string;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
  bookingId: string;
}

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
  connectAccountId?: string;
}

// Register-related types
export interface Register {
  id: string;
  activityId: string;
  date: Date;
  totalBookings: number;
  presentCount: number;
  absentCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterEntry {
  id: string;
  registerId: string;
  bookingId: string;
  childId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRegisterRequest {
  activityId: string;
  date: string;
  notes?: string;
}

export interface UpdateAttendanceRequest {
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

// Message and notification types
export interface Message {
  id: string;
  senderId: string;
  recipientId?: string;
  recipientType: 'user' | 'all' | 'parents' | 'staff';
  subject: string;
  content: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  status: 'draft' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'booking' | 'reminder' | 'update' | 'system' | 'payment';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageRequest {
  recipientId?: string;
  recipientType: 'user' | 'all' | 'parents' | 'staff';
  subject: string;
  content: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
}

// Common types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
}

// Stripe-related types
export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  connectClientId: string;
  platformFeePercentage: number;
  platformFeeFixed: number;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

// Audit and compliance types
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface DataRetentionPolicy {
  id: string;
  dataType: string;
  retentionPeriod: number;
  retentionUnit: 'days' | 'months' | 'years';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  createdAt: Date;
  processed: boolean;
  processedAt?: Date;
}

// All types are already exported above
