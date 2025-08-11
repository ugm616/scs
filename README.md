# Staggered Chat System (SCS)

---

A fully static, serverless, end-to-end encrypted chat that connects peers directly via WebRTC data channels, with manual signaling (copy/paste) and a built-in QR fallback. The header shows only the room number—no names, no branding.

## Highlights
- End-to-end encryption: AES-GCM with HKDF-derived keys
- No backend: manual signaling via copy/paste or QR
- Minimal UI: header only shows room number
- Optional STUN input for NAT traversal (defaults to none)
- Vanilla JS, no build step, no dependencies

---

## Quick start
1. Place files on any static host or open `index.html` directly from disk in two different browsers/devices.
2. On one device:
   - Click “Create offer”.
   - Copy the local payload or show QR.
3. On the other device:
   - Click “Accept offer, make answer”.
   - Paste (or scan) the first device’s payload.
   - Your answer will appear in “local payload”; copy it back.
4. On the first device:
   - Paste the answer into “remote payload” and click “Apply remote”.

When connected, the signaling panel collapses. Type and send messages at the bottom.

---

## Room and key
- The URL fragment stores `#r=ROOM&k=KEY` (never sent to servers).
- ROOM: short base36 identifier shown in the header.
- KEY: 32-byte random secret, base64url-encoded.
- You can regenerate either via the “New” buttons; this resets the session.

---

## Encryption
- A message key is derived using HKDF:
  - Input keying material: 32-byte secret from `k`
  - Info: `"msg-v1"`
  - Salt: `roomId` bytes
- Signaling payloads (offers/answers) are also encrypted with a separate derived key:
  - Info: `"sig-v1"`
  - Salt: `roomId` bytes
- Each message uses AES-GCM with a random 96-bit nonce.

All crypto uses WebCrypto APIs in the browser.

---

## ICE / NAT traversal
- By default, no STUN is used to remain completely serverless.
- You may add public STUN servers in the “ICE” field (comma-separated), e.g.:
  - `stun:stun.l.google.com:19302,stun:global.stun.twilio.com:3478`
- Without STUN, connectivity may require both peers to be on the same LAN or have public routes.
- Tor Browser may restrict WebRTC; manual signaling still works but data channels may not.

---

## Files
- `index.html` — UI layout (header with room number only, signaling panel, chat)
- `style.css` — lightweight styles
- `utils.js` — base64, UUID, URL hash helpers
- `crypto.js` — HKDF and AES-GCM utilities; JSON sealing
- `signaling.js` — encrypted signaling blobs + QR rendering
- `fallback.js` — connection monitoring and graceful close
- `main.js` — app orchestration, message send/receive, UI events

---

## Trust and constraints
- This app is entirely static; secrets live in the URL fragment and in-memory.
- Anyone with the URL fragment (`#r=...&k=...`) can join the room. Share carefully.
- For stronger hygiene, rotate `k` for each session.

---

## Development notes
- No build step required. Keep files in the same directory; serve via any static server.
- Tested in modern Chromium/Firefox. Safari requires HTTPS for WebRTC and clipboard in some cases.
- For debugging, open devtools and watch console for ICE states.

---

## License
Public domain / Unlicense. Use and modify freely.

