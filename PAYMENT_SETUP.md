# Payme Payment Integration Setup Guide

## Overview

This guide explains how to set up and test the Payme payment integration for the Bozor Management System.

## Environment Variables Required

Add these variables to your `.env` file:

```env
# Payme Integration Configuration
PAYME_MERCHANT_ID="your-payme-merchant-id"
PAYME_SECRET_KEY="your-payme-secret-key"
PAYME_BASE_URL="https://checkout.paycom.uz"
```

## Database Schema

The Transaction model has been added to track payments:

```prisma
model Transaction {
  id                 Int      @id @default(autoincrement())
  amount             Decimal
  status             String   @default("PENDING") // PENDING, PAID, FAILED, CANCELLED
  paymeTransactionId String?  // The transaction ID received from Payme

  lease              Lease    @relation(fields: [leaseId], references: [id])
  leaseId            Int

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

## API Endpoints

### Public Endpoints (No Authentication Required)

1. **GET /api/payments/public/leases/:id**

   - Get lease information for payment page
   - Used by customer payment page

2. **POST /api/payments/public/payments/initiate**

   - Initiate payment from customer payment page
   - Body: `{ "leaseId": 1, "amount": 500000 }`

3. **POST /api/payments/payments/callback**
   - Payme webhook endpoint
   - Handles transaction verification and confirmation

### Protected Endpoints (Authentication Required)

1. **POST /api/payments/payments/initiate**

   - Initiate payment from admin panel
   - Requires `CREATE_TRANSACTION` permission

2. **GET /api/payments/payments/transactions/:leaseId**
   - Get transaction history for a lease
   - Requires `VIEW_TRANSACTIONS` permission

## Payment Workflow

1. **Customer scans QR code** → `https://your-domain.com/pay/lease/42`
2. **Payment page loads** → Calls `GET /api/payments/public/leases/42`
3. **Customer confirms payment** → Calls `POST /api/payments/public/payments/initiate`
4. **Backend creates transaction** → Calls Payme API
5. **Customer redirected to Payme** → Completes payment
6. **Payme calls webhook** → `POST /api/payments/payments/callback`
7. **Transaction status updated** → PENDING → PAID/FAILED

## Testing

### 1. Prerequisites

- Create an owner and lease first
- Set up environment variables
- Ensure server is running

### 2. Test Sequence

1. Test lease creation
2. Test public lease info endpoint
3. Test payment initiation
4. Test webhook callbacks (simulate Payme responses)

### 3. Test Commands

```bash
# Test public lease info
curl http://localhost:3000/api/payments/public/leases/1

# Test payment initiation
curl -X POST http://localhost:3000/api/payments/public/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{"leaseId": 1, "amount": 500000}'

# Test webhook (CheckPerformTransaction)
curl -X POST http://localhost:3000/api/payments/payments/callback \
  -H "Content-Type: application/json" \
  -d '{
    "method": "CheckPerformTransaction",
    "params": {
      "amount": 50000000,
      "account": {"lease_id": "1"}
    },
    "id": 1
  }'
```

## QR Code Generation

For each active lease, generate a QR code with the URL:

```
https://your-domain.com/pay/lease/{lease_id}
```

Example for lease ID 42:

```
https://your-domain.com/pay/lease/42
```

## Payme API Integration Notes

- **Amount Conversion**: The service automatically converts UZS to tiyin (1 UZS = 100 tiyin)
- **Signature Generation**: Uses HMAC-SHA256 for API authentication
- **Webhook Security**: The callback endpoint must be publicly accessible
- **Transaction States**: PENDING → PAID/FAILED/CANCELLED

## Next Steps

1. **Frontend Development**: Create the Vue.js payment page component
2. **QR Code Management**: Implement QR code generation and management
3. **Transaction Reports**: Add transaction history and reporting features
4. **Error Handling**: Implement comprehensive error handling and logging
5. **Security**: Add additional security measures for webhook validation

## Troubleshooting

### Common Issues

1. **"Payme API error"**: Check environment variables and API credentials
2. **"Transaction not found"**: Ensure lease exists and is active
3. **"Invalid amount"**: Verify amount conversion (UZS to tiyin)
4. **"Webhook not working"**: Ensure callback endpoint is publicly accessible

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

Check server logs for detailed error information.
