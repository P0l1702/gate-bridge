export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const authHeader = req.headers.authorization;
  const validTokens = [
    `Bearer ${process.env.MYTOKEN}`,
    `Bearer ${process.env.TOKEN_B}`, // Add other tokens here if needed
    `Bearer ${process.env.TOKEN_C}`
  ];

  if (!validTokens.includes(authHeader)) {
    return res.status(403).json({ error: 'Access Denied. Invalid Token.' });
  }

  try {
    const shellyUrl = `${process.env.SHELLY_SERVER}/device/relay/control`;
    
    // Prepare the data payload once
    const payload = new URLSearchParams({
      id: process.env.SHELLY_DEVICE_ID,
      auth_key: process.env.SHELLY_AUTH_KEY,
      channel: '0',
      turn: 'on'
    });

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload
    };

    // --- PHASE 1: THE WAKE-UP PING ---
    // This first request pulls the Shelly out of Eco Mode. 
    // Even if the relay doesn't trigger, the Wi-Fi chip wakes up.
    console.log("Phase 1: Sending wake-up ping to Shelly...");
    await fetch(shellyUrl, requestOptions);

    // --- PHASE 2: TACTICAL DELAY ---
    // Wait 1.5 seconds to allow the hardware to sync with the cloud
    console.log("Waiting 1.5 seconds for hardware wake-up...");
    await new Promise(resolve => setTimeout(resolve, 1500));

    // --- PHASE 3: THE ACTUAL COMMAND ---
    // The Shelly is now at full power. This request will trigger the relay.
    console.log("Phase 3: Sending the actual unlock command...");
    const finalResponse = await fetch(shellyUrl, requestOptions);
    const responseText = await finalResponse.text();

    console.log("Shelly gate unlocked successfully (Double Tap).");
    return res.status(200).json({ 
      message: 'Shelly awoken and gate unlocked!', 
      shelly: responseText 
    });

  } catch (error) {
    console.error("Shelly execution error:", error);
    return res.status(500).json({ error: 'Internal Server Error during Shelly unlock.' });
  }
}