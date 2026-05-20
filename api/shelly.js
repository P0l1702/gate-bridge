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
    const shellyUrl = `${process.env.SHELLY_SERVER}/device/relay/control`;
    await fetch(shellyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id: process.env.SHELLY_DEVICE_ID,
        auth_key: process.env.SHELLY_AUTH_KEY,
        channel: '0',
        turn: 'on'
      })
    });
    console.log("Shelly gate unlocked successfully.");
    return res.status(200).json({ message: 'Shelly gate unlocked!' });
  } catch (error) {
    console.error("Shelly execution error:", error);
    return res.status(500).json({ error: 'Internal Server Error during Shelly unlock.' });
  }
}