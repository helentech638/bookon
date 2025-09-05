# BookOn API Documentation

## Overview
The BookOn API is a comprehensive booking management system that provides endpoints for managing venues, activities, bookings, payments, and user management. This document outlines all available endpoints, request/response formats, and authentication requirements.

## Base URL
```
Production: https://bookon-mu.vercel.app/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting
- **Standard endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **Webhook endpoints**: 1000 requests per minute

## Error Handling
All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": "Additional error information"
  }
}
```

## Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Authentication Endpoints

### POST /auth/login
Authenticate a user and receive access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "parent"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### POST /auth/refresh
Refresh an expired access token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### POST /auth/logout
Logout a user and invalidate tokens.

**Headers:** `Authorization: Bearer <token>`

### GET /auth/profile
Get the current user's profile.

**Headers:** `Authorization: Bearer <token>`

### PUT /auth/profile
Update the current user's profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

---

## User Management

### GET /users
Get all users (Admin/Staff only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `role` - Filter by user role
- `search` - Search by name or email

### POST /users
Create a new user (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "parent"
}
```

---

## Venue Management

### GET /venues
Get all venues.

**Query Parameters:**
- `city` - Filter by city
- `has_activities` - Filter venues with activities
- `search` - Search by name or description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "venue-uuid",
      "name": "Sports Center",
      "description": "Multi-purpose sports facility",
      "address": "123 Sports St",
      "city": "London",
      "capacity": 100,
      "isActive": true
    }
  ]
}
```

### POST /venues
Create a new venue (Admin/Staff only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Venue",
  "description": "Venue description",
  "address": "456 New St",
  "city": "Manchester",
  "capacity": 50
}
```

### GET /venues/:id
Get a specific venue by ID.

### PUT /venues/:id
Update a venue (Admin/Staff only).

**Headers:** `Authorization: Bearer <token>`

### DELETE /venues/:id
Delete a venue (Admin only).

**Headers:** `Authorization: Bearer <token>`

---

## Activity Management

### GET /activities
Get all activities.

**Query Parameters:**
- `venue_id` - Filter by venue
- `category` - Filter by category
- `date` - Filter by date
- `price_min` - Minimum price
- `price_max` - Maximum price
- `available_only` - Show only available activities

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "activity-uuid",
      "name": "Swimming Lessons",
      "description": "Learn to swim",
      "venueId": "venue-uuid",
      "startDate": "2024-01-15",
      "endDate": "2024-01-15",
      "startTime": "14:00",
      "endTime": "15:00",
      "maxCapacity": 20,
      "currentBookings": 15,
      "price": 25.00,
      "category": "Sports",
      "isActive": true
    }
  ]
}
```

### POST /activities
Create a new activity (Admin/Staff only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Activity",
  "description": "Activity description",
  "venueId": "venue-uuid",
  "startDate": "2024-01-20",
  "endDate": "2024-01-20",
  "startTime": "10:00",
  "endTime": "11:00",
  "maxCapacity": 15,
  "price": 30.00,
  "category": "Arts"
}
```

### GET /activities/:id
Get a specific activity by ID.

### PUT /activities/:id
Update an activity (Admin/Staff only).

**Headers:** `Authorization: Bearer <token>`

### DELETE /activities/:id
Delete an activity (Admin only).

**Headers:** `Authorization: Bearer <token>`

---

## Booking Management

### GET /bookings
Get all bookings for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` - Filter by booking status
- `date_from` - Filter from date
- `date_to` - Filter to date
- `search` - Search by activity or venue name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "booking-uuid",
      "bookingNumber": "BK-2024-001",
      "childName": "Emma Johnson",
      "activity": "Swimming Lessons",
      "venue": "Sports Center",
      "date": "2024-01-20",
      "time": "14:00-15:00",
      "status": "confirmed",
      "amount": 25.00,
      "paymentStatus": "paid"
    }
  ]
}
```

### POST /bookings
Create a new booking.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "activityId": "activity-uuid",
  "childId": "child-uuid",
  "date": "2024-01-20",
  "notes": "Special requirements"
}
```

### GET /bookings/:id
Get a specific booking by ID.

**Headers:** `Authorization: Bearer <token>`

### PUT /bookings/:id
Update a booking.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "notes": "Updated notes",
  "status": "confirmed"
}
```

### DELETE /bookings/:id
Cancel a booking.

**Headers:** `Authorization: Bearer <token>`

---

## Payment Management

### POST /payments/create-intent
Create a Stripe payment intent for a booking.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "bookingId": "booking-uuid",
  "amount": 25.00,
  "currency": "GBP"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx"
  }
}
```

### POST /payments/refund
Process a refund for a payment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "paymentId": "payment-uuid",
  "amount": 25.00,
  "reason": "Customer request"
}
```

### GET /payments/:paymentId/refunds
Get refund history for a payment.

**Headers:** `Authorization: Bearer <token>`

---

## Admin Endpoints

### GET /admin/stats
Get admin dashboard statistics.

**Headers:** `Authorization: Bearer <token>` (Admin/Staff only)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalVenues": 12,
    "totalActivities": 45,
    "totalBookings": 320,
    "monthlyRevenue": 8500.00
  }
}
```

### GET /admin/bookings
Get all bookings for admin view.

**Headers:** `Authorization: Bearer <token>` (Admin/Staff only)

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `status` - Filter by status
- `venue_id` - Filter by venue
- `activity_id` - Filter by activity
- `user_id` - Filter by user
- `date_from` - Filter from date
- `date_to` - Filter to date
- `search` - Search term

### PUT /admin/bookings/:id
Update booking status (Admin/Staff only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "confirmed",
  "notes": "Admin notes"
}
```

---

## Register Management

### GET /registers
Get all registers (Admin/Staff only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `venueId` - Filter by venue
- `activityId` - Filter by activity
- `date` - Filter by date
- `startDate` - Filter from date
- `endDate` - Filter to date

### POST /registers/auto-generate
Auto-generate registers from confirmed bookings.

**Headers:** `Authorization: Bearer <token>` (Admin/Staff only)

**Request Body:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "venueId": "venue-uuid",
  "activityId": "activity-uuid"
}
```

### GET /registers/:id/export/csv
Export register to CSV format.

**Headers:** `Authorization: Bearer <token>` (Admin/Staff only)

**Response:** CSV file download

### GET /registers/stats
Get register statistics.

**Headers:** `Authorization: Bearer <token>` (Admin/Staff only)

---

## Widget Endpoints

### GET /widget
Get widget configuration and data.

**Query Parameters:**
- `venueId` - Venue ID for widget
- `activityId` - Activity ID for widget
- `theme` - Widget theme (light/dark/auto)
- `primaryColor` - Primary color hex code

### GET /widget/activity/:id
Get specific activity data for widget.

### POST /widget/book
Submit a booking through the widget.

**Request Body:**
```json
{
  "activityId": "activity-uuid",
  "date": "2024-01-20",
  "childName": "Child Name",
  "parentEmail": "parent@example.com",
  "phone": "+1234567890",
  "notes": "Special requirements"
}
```

### POST /widget/analytics
Track widget analytics events.

**Request Body:**
```json
{
  "eventType": "WIDGET_VIEW",
  "widgetId": "widget-123",
  "venueId": "venue-uuid",
  "activityId": "activity-uuid",
  "eventData": {}
}
```

---

## Webhook Endpoints

### POST /webhooks/external
Receive webhooks from external services.

**Headers:** `x-webhook-secret: <webhook_secret>`

**Request Body:**
```json
{
  "event": "user.created",
  "source": "external_system",
  "data": {
    "userId": "user-uuid",
    "email": "user@example.com"
  }
}
```

### GET /webhooks/events
Get webhook event history (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` - Number of events to return
- `offset` - Offset for pagination
- `event_type` - Filter by event type
- `source` - Filter by source
- `processed` - Filter by processing status

### POST /webhooks/events/:id/retry
Retry a failed webhook event (Admin only).

**Headers:** `Authorization: Bearer <token>`

### GET /webhooks/health
Webhook system health check.

---

## Stripe Webhooks

### POST /webhooks/stripe
Receive Stripe webhook events.

**Headers:** `stripe-signature: <signature>`

**Supported Events:**
- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed
- `refund.created` - Refund processed

---

## Error Codes

| Code | Description |
|------|-------------|
| `MISSING_CREDENTIALS` | Email or password missing |
| `INVALID_CREDENTIALS` | Invalid email or password |
| `TOKEN_EXPIRED` | JWT token has expired |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `PAYMENT_FAILED` | Payment processing failed |
| `BOOKING_FULL` | Activity is fully booked |
| `WEBHOOK_SIGNATURE_MISSING` | Webhook signature not provided |
| `WEBHOOK_SIGNATURE_INVALID` | Invalid webhook signature |

---

## Pagination

Most list endpoints support pagination with the following response format:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Data Types

### Date Format
All dates are in ISO 8601 format: `YYYY-MM-DD`

### Time Format
Times are in 24-hour format: `HH:MM`

### Currency
All monetary amounts are in decimal format with 2 decimal places (e.g., `25.00`)

### UUIDs
All IDs are UUIDs in the format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install axios
```

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bookon-mu.vercel.app/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Example usage
const bookings = await api.get('/bookings');
```

### Python
```bash
pip install requests
```

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://bookon-mu.vercel.app/api/v1/bookings',
    headers=headers
)
bookings = response.json()
```

---

## Support

For API support and questions:
- **Email**: support@bookon.com
- **Documentation**: https://docs.bookon.com
- **Status Page**: https://status.bookon.com

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- Complete booking management system
- Stripe payment integration
- Admin dashboard endpoints
- Widget system
- Webhook infrastructure

---

*Last updated: January 2024*
