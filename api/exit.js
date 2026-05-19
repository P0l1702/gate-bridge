import { RingApi } from 'ring-client-api';

const ringApi = new RingApi({
  refreshToken: process.env.RING_REFRESH_TOKEN
});

// Helper function to create a non-blocking delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  // 1. Security Check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // 2. Authentication: Validate against multiple tokens
  const authHeader = req.headers.authorization;
  const validTokens = [
    `Bearer ${process.env.MYTOKEN}`,
    `Bearer ${process.env.TOKEN_B}`,
    `Bearer ${process.env.TOKEN_C}`,
    `Bearer ${process.env.TOKEN_D}`
  ];
  
  if (!validTokens.includes(authHeader)) {
    console.warn("Unauthorized access attempt blocked.");
    return res.status(403).json({ error: 'Access Denied. Invalid Token.' });
  }

  try {
    // 3. STEP 1: Unlock secondary gate immediately via Shelly
    const shellyUrl = `${process.env.SHELLY_SERVER}/device/relay/control`;
    await fetch(shellyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        channel: '0',
        turn: 'on',
        id: process.env.SHELLY_DEVICE_ID,
        auth_key: process.env.SHELLY_AUTH_KEY
      })
    });
    console.log("Exit Sequence: Secondary gate unlocked.");

    // 4. STEP 2: Wait for 5 seconds
    console.log("Exit Sequence: Waiting 5 seconds...");
    await delay(5000);

    // 5. STEP 3: Unlock main gate via Ring
    const locations = await ringApi.getLocations();
    const myIntercom = locations[0].intercoms[0];
    await myIntercom.unlock();
    console.log("Exit Sequence: Main gate unlocked.");

    return res.status(200).json({ message: 'Exit sequence completed successfully!' });

  } catch (error) {
    console.error("Exit sequence execution error:", error);
    return res.status(500).json({ error: 'Internal Server Error during exit process.' });
  }
}