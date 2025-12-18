# TTLock Smart Lock Integration

This document describes the TTLock integration for automatic PIN code generation after booking acceptance.

## Overview

When a booking is accepted, the system automatically generates a temporary PIN code for the customer to access the property using a TTLock smart lock. The PIN is valid only during the booking period (check-in to check-out).

## Components

### Backend

#### 1. TTLock Helper (`server/api-util/ttlock.js`)
- Handles authentication with TTLock API (euapi.ttlock.com)
- Caches access token for 24 hours
- Generates random 6-digit PIN codes
- Creates temporary keyboard passwords via TTLock API
- Exports: `createTemporaryPin(lockId, startDate, endDate, guestName)`

**Environment Variables Required:**
```
TTLOCK_CLIENT_ID=your_client_id
TTLOCK_CLIENT_SECRET=your_client_secret
TTLOCK_USERNAME=your_username
TTLOCK_PASSWORD=your_password
```

#### 2. API Endpoint (`server/api/ttlock-create-pin.js`)
- **Route:** POST `/api/ttlock-create-pin`
- **Body:** `{ transactionId: UUID }`
- **Process:**
  1. Fetches transaction with listing and booking details
  2. Extracts `lockId` from `listing.attributes.publicData.lockId`
  3. Gets booking start/end dates
  4. Calls TTLock API to create temporary PIN
  5. Updates `transaction.attributes.metadata.ttlock` with PIN details
  6. Returns PIN to customer
- **Response:** `{ success: true, pin: "123456", lockId, startDate, endDate }`

### Frontend

#### 3. Listing Form (`EditListingDetailsForm.js`)
- Added `lockId` field (FieldTextInput)
- Required field with validation
- Stored in `listing.attributes.publicData.lockId`
- Translations: `EditListingDetailsForm.lockIdLabel/Placeholder/Required`

#### 4. Access Code Panel (`src/containers/TransactionPage/AccessCodePanel/`)
- Displays to customers after booking is accepted
- Shows "Generate Access Code" button
- Calls `/api/ttlock-create-pin` endpoint
- Displays generated 6-digit PIN
- Handles already-generated state
- Provides error handling and retry capability

**States:**
- Not generated: Shows generate button
- Generating: Shows loading state
- Generated: Displays PIN prominently
- Already exists: Shows message to contact host

#### 5. Transaction Panel Integration
- `AccessCodePanel` added to `TransactionPanel.js`
- Only visible to customers after booking acceptance
- Positioned after BookingLocationMaybe section

## Data Flow

```
1. Host creates listing
   └─> Enters lockId in listing form
       └─> Stored in listing.publicData.lockId

2. Customer books property
   └─> Completes payment (transition/confirm-payment)
       └─> Host accepts booking (transition/accept)

3. Customer views booking
   └─> AccessCodePanel shows "Generate Access Code" button
       └─> Customer clicks button
           └─> POST /api/ttlock-create-pin
               ├─> Fetches transaction, listing, booking
               ├─> Calls TTLock API
               ├─> Creates PIN valid from check-in to check-out
               ├─> Stores details in transaction.metadata.ttlock
               └─> Returns PIN to customer

4. Customer sees PIN
   └─> Uses PIN to access property during booking period
```

## Security Considerations

- PIN stored in `transaction.metadata` (not publicData)
- Only transaction participants can access metadata
- TTLock access token never exposed to frontend
- API endpoint validates transaction exists and user has access
- PIN is time-bound (only valid during booking)

## Testing

### Manual Test Flow:
1. Create listing with lockId "26719075"
2. Make a booking for the listing
3. Complete payment (transition/confirm-payment)
4. Provider accepts (transition/accept)
5. Customer views transaction page
6. Click "Generate Access Code"
7. Verify 6-digit PIN is displayed
8. Check transaction metadata contains ttlock data

### Test TTLock API directly:
```bash
curl -X POST https://euapi.ttlock.com/v3/keyboardPwd/add \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "clientId=YOUR_CLIENT_ID" \
  -d "accessToken=YOUR_ACCESS_TOKEN" \
  -d "lockId=26719075" \
  -d "keyboardPwd=123456" \
  -d "keyboardPwdName=Test Guest" \
  -d "startDate=TIMESTAMP_MS" \
  -d "endDate=TIMESTAMP_MS" \
  -d "date=$(date +%s)000"
```

## Files Modified/Created

### Backend:
- ✅ `server/api-util/ttlock.js` (new)
- ✅ `server/api/ttlock-create-pin.js` (new)
- ✅ `server/apiRouter.js` (added route)

### Frontend:
- ✅ `src/containers/TransactionPage/AccessCodePanel/AccessCodePanel.js` (new)
- ✅ `src/containers/TransactionPage/AccessCodePanel/AccessCodePanel.module.css` (new)
- ✅ `src/containers/TransactionPage/TransactionPanel/TransactionPanel.js` (integrated AccessCodePanel)
- ✅ `src/containers/TransactionPage/TransactionPage.js` (passed transaction prop)
- ✅ `src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/EditListingDetailsForm.js` (added lockId field)
- ✅ `src/containers/EditListingPage/EditListingWizard/EditListingDetailsPanel/EditListingDetailsPanel.js` (lockId in publicData)
- ✅ `src/translations/en.json` (added translations)

## Future Improvements

1. **Automatic PIN Generation**: Trigger PIN creation automatically after accept transition (instead of button click)
2. **Provider View**: Show PIN to provider for support purposes
3. **PIN Regeneration**: Allow regenerating PIN if customer loses it
4. **Multiple Locks**: Support multiple lockIds per listing (e.g., building entrance + unit door)
5. **PIN History**: Track all PINs generated for auditing
6. **Error Notifications**: Email notifications if PIN generation fails
7. **TTLock Webhook**: Receive events when PIN is used
8. **Auto-cleanup**: Automatically delete PIN from TTLock after checkout (currently relies on TTLock expiry)

## Troubleshooting

### PIN generation fails:
- Check TTLock credentials in environment variables
- Verify lockId is correct and accessible
- Check booking dates are valid (future dates)
- Ensure TTLock API is accessible from server

### PIN not displayed:
- Verify transaction state is 'transition/accept'
- Check transaction.metadata.ttlock exists
- Ensure user has permission to view transaction
- Check browser console for errors

### lockId field not showing:
- Verify listing currency is compatible (isCompatibleCurrency)
- Check listing type configuration
- Ensure translations are loaded
