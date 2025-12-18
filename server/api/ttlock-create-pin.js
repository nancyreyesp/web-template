const { createTemporaryPin } = require('../api-util/ttlock');
const { getSdk, handleError, serialize } = require('../api-util/sdk');

/**
 * Create TTLock PIN after booking is accepted
 * 
 * POST /api/ttlock-create-pin
 * 
 * Body params:
 * - transactionId: UUID of the transaction
 */
module.exports = (req, res) => {
  const { transactionId } = req.body;

  if (!transactionId) {
    return res.status(400).json({ error: 'Missing transactionId' });
  }

  const sdk = getSdk(req, res);

  // Fetch transaction with listing and booking details
  sdk.transactions
    .show({
      id: transactionId,
      include: ['listing', 'booking'],
    })
    .then(response => {
      const transaction = response.data.data;
      const included = response.data.included || [];

      // Get listing from included
      const listingRef = transaction.relationships?.listing?.data;
      const listing = included.find(
        item => item.type === 'listing' && item.id.uuid === listingRef?.id?.uuid
      );

      // Get booking from included
      const bookingRef = transaction.relationships?.booking?.data;
      const booking = included.find(
        item => item.type === 'booking' && item.id.uuid === bookingRef?.id?.uuid
      );

      if (!listing) {
        throw new Error('Listing not found in transaction');
      }

      if (!booking) {
        throw new Error('Booking not found in transaction');
      }

      // Get lockId from listing publicData
      const lockId = listing.attributes.publicData?.lockId;

      if (!lockId) {
        throw new Error('Lock ID not configured for this listing');
      }

      // Get booking dates
      const bookingStart = booking.attributes.start;
      const bookingEnd = booking.attributes.end;

      if (!bookingStart || !bookingEnd) {
        throw new Error('Booking dates not found');
      }

      // Get customer info for PIN name
      const customerRef = transaction.relationships?.customer?.data;
      const customer = included.find(
        item => item.type === 'user' && item.id.uuid === customerRef?.id?.uuid
      );
      const guestName = customer?.attributes?.profile?.displayName || 'Guest';

      // Create TTLock PIN
      return createTemporaryPin(lockId, bookingStart, bookingEnd, guestName);
    })
    .then(pinResult => {
      if (!pinResult.success) {
        throw new Error(pinResult.error || 'Failed to create PIN');
      }

      // Update transaction metadata with PIN info (without exposing the PIN itself in publicData)
      return sdk.transactions.updateMetadata({
        id: transactionId,
        metadata: {
          ttlock: {
            lockId: pinResult.lockId,
            keyboardPwdId: pinResult.keyboardPwdId,
            startDate: pinResult.startDate,
            endDate: pinResult.endDate,
            createdAt: new Date().toISOString(),
          },
        },
      }).then(() => pinResult);
    })
    .then(pinResult => {
      res.status(200).send(
        serialize({
          success: true,
          pin: pinResult.pin,
          lockId: pinResult.lockId,
          startDate: pinResult.startDate,
          endDate: pinResult.endDate,
        })
      );
    })
    .catch(e => {
      console.error('TTLock PIN creation failed:', e);
      handleError(res, e);
    });
};
