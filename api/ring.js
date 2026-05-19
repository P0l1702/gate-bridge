import { RingApi } from 'ring-client-api';

const ringApi = new RingApi({
  refreshToken: process.env.RING_REFRESH_TOKEN
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const authHeader = req.headers.authorization;
  const validTokens = [
    `Bearer ${process.env.MYTOKEN}`,
    `Bearer ${process.env.TOKEN_B}`,
    `Bearer ${process.env.TOKEN_C}`,
    `Bearer ${process.env.TOKEN_D}`
  ];

  if (!validTokens.includes(authHeader)) {
    return res.status(403).json({ error: 'Access Denied. Invalid Token.' });
  }

  try {
    const locations = await ringApi.getLocations();
    const myIntercom = locations[0].intercoms[0];
    await myIntercom.unlock();
    console.log("Ring gate unlocked successfully.");
    return res.status(200).json({ message: 'Ring gate unlocked!' });
  } catch (error) {
    console.error("Ring execution error:", error);
    return res.status(500).json({ error: 'Internal Server Error during Ring unlock.' });
  }
}