# Free SIM-style Calling App

This is a lightweight free-calling prototype that lets two people make voice calls over the internet using a shared **Call ID** (for example, a phone-number-like code such as `555-1001`).

## Features

- Join calls by name + call ID
- Browser-based audio calling with WebRTC
- No paid SIM balance needed (internet connection required)
- Simple signaling server via Socket.IO

## How to open it in your browser (website)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the app server:

   ```bash
   npm start
   ```

3. Open the website in your browser:

   ```
   http://localhost:3000
   ```

4. Test a call:
   - Open the same URL in a second tab, second browser, or another device on the same network.
   - Enter a name on both sides.
   - Enter the same Call ID (example: `555-1001`) on both sides.
   - Click **Join Call**.

## Open from another device (same Wi‑Fi)

- Find your computer's local IP (example `192.168.1.25`).
- Start the app with host binding:

  ```bash
  HOST=0.0.0.0 npm start
  ```

- On your phone/another laptop, open:

  ```
  http://<your-local-ip>:3000
  ```

Example: `http://192.168.1.25:3000`

## Notes

- This is not a PSTN/SIM-network dialer; it is a free internet voice-calling app.
- For production use, add authentication, TURN servers, and encryption hardening.
