# Payment Gateway System - Documentation

## Overview
This document describes the complete payment gateway system implementation for the GlamourShop MERN e-commerce backend.

## Files Created

### 1. Controllers
- **`server/src/controllers/payment.controller.ts`**
  - Stripe integration (createStripeIntent, confirmStripePayment, stripeWebhook)
  - Orange Money integration (initiateOrangeMoney, orangeMoneyCallback)
  - Wave integration (initiateWave, waveCallback)
  - Payment refund functionality (refundPayment)

- **`server/src/controllers/upload.controller.ts`**
  - Cloudinary image upload (uploadImage, uploadImages)
  - Image deletion (deleteImage)

- **`server/src/controllers/notification.controller.ts`**
  - Get user notifications (getMyNotifications)
  - Mark notifications as read (markAsRead, markAllAsRead)
  - Delete notifications (deleteNotification)

### 2. Routes
- **`server/src/routes/payment.routes.ts`**
  - POST `/api/v1/payments/stripe/create-intent` (protected)
  - POST `/api/v1/payments/stripe/confirm` (protected)
  - POST `/api/v1/payments/stripe/webhook` (public, raw body)
  - POST `/api/v1/payments/orange-money/initiate` (protected)
  - POST `/api/v1/payments/orange-money/callback` (public)
  - POST `/api/v1/payments/wave/initiate` (protected)
  - POST `/api/v1/payments/wave/callback` (public)
  - POST `/api/v1/payments/:id/refund` (protected, admin)

- **`server/src/routes/upload.routes.ts`**
  - POST `/api/v1/upload/image` (protected, admin)
  - POST `/api/v1/upload/images` (protected, admin)
  - DELETE `/api/v1/upload/image/:publicId` (protected, admin)

- **`server/src/routes/notification.routes.ts`**
  - GET `/api/v1/notifications` (protected)
  - PUT `/api/v1/notifications/:id/read` (protected)
  - PUT `/api/v1/notifications/read-all` (protected)
  - DELETE `/api/v1/notifications/:id` (protected)

### 3. Models
- **`server/src/models/Notification.model.ts`**
  - Fields: user, type, title, message, data, isRead, readAt
  - Types: order_status, payment, promotion, system, review
  - Indexes: user+isRead, createdAt

### 4. Configuration
- **`server/src/config/socket.ts`**
  - Socket.io initialization with CORS
  - User room management (join/leave)
  - Helper functions: emitNotificationToUser, emitOrderUpdateToUser, broadcastNotification

### 5. Utilities
- **`server/src/utils/notificationHelper.ts`**
  - createNotification helper function
  - Pre-defined notification templates (orderConfirmed, paymentCompleted, etc.)

### 6. Updated Files
- **`server/src/app.ts`**
  - Added payment, upload, and notification routes
  - Added raw body parser for Stripe webhooks
  - Updated CORS headers for webhook signatures

- **`server/src/server.ts`**
  - Integrated Socket.io with HTTP server
  - Added WebSocket initialization

## Environment Variables Required

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Orange Money
ORANGE_MONEY_CLIENT_ID=your_client_id
ORANGE_MONEY_CLIENT_SECRET=your_client_secret
ORANGE_MONEY_MERCHANT_KEY=your_merchant_key

# Wave
WAVE_API_KEY=your_api_key
WAVE_WEBHOOK_SECRET=your_webhook_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Packages Installed

```bash
npm install axios stripe
npm install --save-dev @types/stripe
```

## API Usage Examples

### Stripe Payment Flow

1. **Create Payment Intent**
```javascript
POST /api/v1/payments/stripe/create-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "65abc123..."
}

Response:
{
  "success": true,
  "message": "PaymentIntent créé avec succès",
  "data": {
    "clientSecret": "pi_..._secret_...",
    "paymentId": "65def456...",
    "amount": 50000
  }
}
```

2. **Confirm Payment**
```javascript
POST /api/v1/payments/stripe/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentId": "65def456...",
  "paymentIntentId": "pi_..."
}

Response:
{
  "success": true,
  "message": "Paiement confirmé avec succès",
  "data": { /* payment object */ }
}
```

### Orange Money Payment Flow

1. **Initiate Payment**
```javascript
POST /api/v1/payments/orange-money/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "65abc123...",
  "phoneNumber": "+221771234567"
}

Response:
{
  "success": true,
  "message": "Paiement Orange Money initié",
  "data": {
    "paymentUrl": "https://...",
    "paymentToken": "...",
    "paymentId": "65def456..."
  }
}
```

### Wave Payment Flow

1. **Initiate Payment**
```javascript
POST /api/v1/payments/wave/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "65abc123..."
}

Response:
{
  "success": true,
  "message": "Paiement Wave initié",
  "data": {
    "checkoutUrl": "https://...",
    "checkoutId": "...",
    "paymentId": "65def456..."
  }
}
```

### Upload Images

1. **Single Image Upload**
```javascript
POST /api/v1/upload/image
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

FormData:
{
  "image": <file>
}

Response:
{
  "success": true,
  "message": "Image uploadée avec succès",
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "glamour-shop/..."
  }
}
```

2. **Multiple Images Upload**
```javascript
POST /api/v1/upload/images
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

FormData:
{
  "images": [<file1>, <file2>, <file3>]
}

Response:
{
  "success": true,
  "message": "3 image(s) uploadée(s) avec succès",
  "data": [
    { "url": "https://...", "publicId": "..." },
    { "url": "https://...", "publicId": "..." }
  ]
}
```

### Notifications

1. **Get My Notifications**
```javascript
GET /api/v1/notifications?page=1&limit=10
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Succès",
  "data": [
    {
      "_id": "65...",
      "user": "65...",
      "type": "order_status",
      "title": "Commande confirmée",
      "message": "Votre commande ORD-... a été confirmée",
      "isRead": false,
      "createdAt": "2024-01-..."
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3,
    "limit": 10
  }
}
```

2. **Mark as Read**
```javascript
PUT /api/v1/notifications/65abc.../read
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Notification marquée comme lue",
  "data": { /* notification object */ }
}
```

## Socket.io Integration

### Client-Side Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  withCredentials: true
});

// Join user room for notifications
socket.emit('join', userId);

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // Update UI with new notification
});

// Listen for order updates
socket.on('orderUpdate', (order) => {
  console.log('Order updated:', order);
  // Update order status in UI
});

// Cleanup on unmount
socket.on('disconnect', () => {
  socket.emit('leave', userId);
});
```

## Payment Flow Diagrams

### Stripe Flow
1. User creates order → Order status: pending, Payment status: pending
2. Frontend calls `/payments/stripe/create-intent` with orderId
3. Backend creates Payment record (status: initiated) and Stripe PaymentIntent
4. Frontend receives clientSecret and displays Stripe payment form
5. User completes payment on Stripe
6. Frontend calls `/payments/stripe/confirm` with paymentId and paymentIntentId
7. Backend verifies with Stripe, updates Payment (status: completed) and Order (status: confirmed, payment: completed)
8. Webhook endpoint receives payment_intent.succeeded event as backup confirmation

### Orange Money Flow
1. User creates order → Order status: pending
2. Frontend calls `/payments/orange-money/initiate` with orderId and phoneNumber
3. Backend creates Payment record, gets Orange Money token, initiates payment
4. Frontend receives paymentUrl and redirects user
5. User completes payment on Orange Money platform
6. Orange Money calls `/payments/orange-money/callback` webhook
7. Backend updates Payment and Order status based on callback

### Wave Flow
1. User creates order → Order status: pending
2. Frontend calls `/payments/wave/initiate` with orderId
3. Backend creates Payment record and Wave checkout session
4. Frontend receives checkoutUrl and redirects user
5. User completes payment on Wave platform
6. Wave calls `/payments/wave/callback` webhook with signature
7. Backend verifies signature, updates Payment and Order status

## Security Considerations

1. **Webhook Verification**
   - Stripe: Uses `stripe.webhooks.constructEvent()` with webhook secret
   - Wave: Verifies HMAC signature with webhook secret
   - Orange Money: Validates payment token

2. **Authentication**
   - All payment initiation endpoints require JWT authentication
   - Webhooks are public but verified via signatures
   - Upload endpoints require admin role

3. **CORS**
   - Configured to allow webhook signature headers
   - Client URL whitelist in environment variables

4. **Rate Limiting**
   - General rate limiter applies to all /api routes
   - Consider adding specific limits for payment endpoints

## Error Handling

All controllers use the `asyncHandler` wrapper and throw `ApiError` for consistent error responses:

```javascript
// Example error responses
{
  "success": false,
  "message": "Commande non trouvée",
  "statusCode": 404
}

{
  "success": false,
  "message": "Accès non autorisé",
  "statusCode": 403
}
```

## Notification Templates

Use the `notificationHelper` for consistent notifications:

```javascript
import { createNotification, notificationTemplates } from '../utils/notificationHelper';

// Order confirmed
await createNotification({
  userId: order.user,
  ...notificationTemplates.orderConfirmed(order.orderNumber),
  data: { orderId: order._id }
});

// Payment completed
await createNotification({
  userId: payment.user,
  ...notificationTemplates.paymentCompleted(order.orderNumber, payment.amount),
  data: { orderId: order._id, paymentId: payment._id }
});
```

## Testing Webhooks Locally

Use tools like:
- **Stripe CLI**: `stripe listen --forward-to localhost:5000/api/v1/payments/stripe/webhook`
- **ngrok**: Expose local server for Orange Money and Wave webhooks
- **Postman**: Simulate webhook calls with proper signatures

## Production Checklist

- [ ] Set all environment variables in production
- [ ] Configure Stripe webhook endpoint in Stripe Dashboard
- [ ] Configure Orange Money callback URL
- [ ] Configure Wave webhook URL
- [ ] Enable HTTPS for webhook endpoints
- [ ] Set up monitoring for failed payments
- [ ] Implement payment reconciliation process
- [ ] Add logging for all payment transactions
- [ ] Set up alerts for webhook failures
- [ ] Test all payment flows in production mode
- [ ] Implement retry logic for failed webhooks
- [ ] Set up backup payment verification cron job

## Additional Notes

- All amounts are in XOF (FCFA)
- Payment records are created before calling external APIs to ensure traceability
- Socket.io enables real-time notification delivery
- Cloudinary optimizes images automatically (1200x1200 max, quality: auto:good)
- Upload middleware limits file size to 5MB per image
- Maximum 10 images per multi-upload request
