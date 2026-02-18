# Free SIM-style Calling App

This is a lightweight free-calling prototype that lets two people make voice calls over the internet using a shared **Call ID** (for example, a phone-number-like code such as `555-1001`).

## Features

- Join calls by name + call ID
- Browser-based audio calling with WebRTC
- No paid SIM balance needed (internet connection required)
- Simple signaling server via Socket.IO

## Run locally

```bash
npm install
npm start
```

Then open `http://localhost:3000` in two browsers/devices and join with the same Call ID.

## Notes

- This is not a PSTN/SIM-network dialer; it is a free internet voice-calling app.
- For production use, add authentication, TURN servers, and encryption hardening.
