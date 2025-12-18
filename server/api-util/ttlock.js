const axios = require('axios');

// TTLock API configuration
const TTLOCK_API_BASE = 'https://euapi.ttlock.com';
const TTLOCK_CLIENT_ID = process.env.TTLOCK_CLIENT_ID || 'fe9f73c14bc446b7878b9ceb00ac3607';
const TTLOCK_CLIENT_SECRET = process.env.TTLOCK_CLIENT_SECRET || '1f61fb142d679c6ca09e605127e796f2';
const TTLOCK_USERNAME = process.env.TTLOCK_USERNAME || 'webdevelopers.room@gmail.com';
const TTLOCK_PASSWORD = process.env.TTLOCK_PASSWORD || 'b25d0429465eabf3b178ed3652b92783';

let cachedAccessToken = null;
let tokenExpiresAt = null;

/**
 * Get or refresh TTLock access token
 */
const getAccessToken = async () => {
  // Return cached token if still valid
  if (cachedAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }

  try {
    const response = await axios.post(
      `${TTLOCK_API_BASE}/oauth2/token`,
      new URLSearchParams({
        client_id: TTLOCK_CLIENT_ID,
        client_secret: TTLOCK_CLIENT_SECRET,
        grant_type: 'password',
        username: TTLOCK_USERNAME,
        password: TTLOCK_PASSWORD,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && response.data.access_token) {
      cachedAccessToken = response.data.access_token;
      // Token typically expires in 7776000 seconds (90 days), but we'll refresh earlier
      tokenExpiresAt = Date.now() + 86400000; // Cache for 24 hours
      return cachedAccessToken;
    }

    throw new Error('Failed to get access token from TTLock');
  } catch (error) {
    console.error('TTLock authentication error:', error.response?.data || error.message);
    throw new Error('TTLock authentication failed');
  }
};

/**
 * Generate a random 6-digit PIN
 */
const generateRandomPin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create a temporary keyboard password (PIN) for a lock
 * @param {string} lockId - The TTLock lock ID
 * @param {Date} startDate - Check-in date/time
 * @param {Date} endDate - Check-out date/time
 * @param {string} guestName - Name of the guest for the PIN
 * @returns {Object} - { success, pin, lockId, startDate, endDate, error }
 */
const createTemporaryPin = async (lockId, startDate, endDate, guestName = 'Guest') => {
  try {
    const accessToken = await getAccessToken();
    const pin = generateRandomPin();
    const now = Date.now();

    // Convert dates to milliseconds timestamps
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();

    const response = await axios.post(
      `${TTLOCK_API_BASE}/v3/keyboardPwd/add`,
      new URLSearchParams({
        clientId: TTLOCK_CLIENT_ID,
        accessToken: accessToken,
        lockId: lockId,
        keyboardPwd: pin,
        keyboardPwdName: `Booking - ${guestName}`,
        startDate: startTimestamp.toString(),
        endDate: endTimestamp.toString(),
        date: now.toString(),
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && (response.data.errcode === 0 || response.data.keyboardPwdId)) {
      return {
        success: true,
        pin: pin,
        lockId: lockId,
        startDate: startDate,
        endDate: endDate,
        keyboardPwdId: response.data.keyboardPwdId,
      };
    }

    console.error('TTLock PIN creation failed:', response.data);
    return {
      success: false,
      error: response.data?.errmsg || 'Failed to create PIN',
    };
  } catch (error) {
    console.error('TTLock create PIN error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errmsg || error.message || 'Failed to create PIN',
    };
  }
};

/**
 * Delete a temporary keyboard password
 * @param {string} lockId - The TTLock lock ID
 * @param {string} keyboardPwdId - The keyboard password ID to delete
 */
const deleteTemporaryPin = async (lockId, keyboardPwdId) => {
  try {
    const accessToken = await getAccessToken();
    const now = Date.now();

    const response = await axios.post(
      `${TTLOCK_API_BASE}/v3/keyboardPwd/delete`,
      new URLSearchParams({
        clientId: TTLOCK_CLIENT_ID,
        accessToken: accessToken,
        lockId: lockId,
        keyboardPwdId: keyboardPwdId.toString(),
        date: now.toString(),
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data?.errcode === 0;
  } catch (error) {
    console.error('TTLock delete PIN error:', error.response?.data || error.message);
    return false;
  }
};

module.exports = {
  createTemporaryPin,
  deleteTemporaryPin,
  getAccessToken,
};
