# Staggered Chat System (SCS)

A fully serverless, portable, end‑to‑end encrypted chat system built from pure static files. No accounts. No backend. Just chat—anywhere HTML can run.

SCS creates peer-to-peer chat “rooms” via manual handshake. Ideal for weak networks, off-grid setups, and private communication.

---

## Why “staggered”?

SCS prioritizes resilience and reliability over immediacy:

- Manual handshake (QR, chirp, code) avoids infrastructure
- Delivery ACKs and retries ensure message persistence
- "Snail mode" enables chat even when direct peer-to-peer fails

---

## Features

- End‑to‑end encryption with per-room ephemeral keys (AES‑GCM)
- Purely static bundle (< 60 KB gzipped), no build steps
- Zero-infrastructure handshake via:
  - Audio chirp
  - QR code
  - Text code
- Delivery indicators and presence states
- Cryptographic room retirement
- Offline support via optional Service Worker
- Embeddable widget integration

---

## Repository Contents

```
/scs
  ├── index.html       # UI and bootstrap
  ├── scs.min.js       # Core logic
  ├── sw.js            # Optional offline caching
  ├── 404.html         # Deep link fallback for GitHub Pages
README.md              # Documentation
```

---

## Installation

### Option 1: Static Hosting

- Copy the `/scs` directory to your web server's document root
- Visit `/scs` in a browser to create a chat room

Optional routing:

- Nginx:
  ```nginx
  location /scs/ {
    try_files $uri /scs/index.html;
  }
  ```

- Apache (.htaccess):
  ```apache
  RewriteEngine On
  RewriteBase /scs/
  RewriteRule ^.*$ index.html [L]
  ```

If routing is unavailable, use hash URLs like `/scs/#/ROOM`

### Option 2: GitHub Pages

- Push `/scs` to a GitHub repo
- Enable GitHub Pages
- Use `404.html` to support deep linking

---

## Embedding

Use the embeddable widget:

```html
<div id="my-chat"></div>
<script src="/scs/scs.min.js"
        data-scs-target="#my-chat"
        data-scs-mode="embed"
        defer></script>
```

Or embed a specific room:

```html
<script src="/scs/scs.min.js"
        data-scs-target="#chat"
        data-scs-mode="embed"
        data-scs-room="ROOM"
        data-scs-key="BASE64URL_KEY"
        defer></script>
```

---

## Security Model

- AES‑GCM encryption; keys derived via HKDF
- Keys reside in URL fragment (never sent to servers)
- Optional Ed25519 signatures for authenticity
- Local message queue; cryptographic erasure on room retire
- No external telemetry, cookies, or analytics

Note: Anyone with the full room URL can read messages

---

## Handshake Methods

1. Audio chirp (speaker to mic)
2. QR code scan
3. Short text code (copy/paste)

Fallback "snail mode" encodes chat frames for relay when WebRTC fails

---

## Presence and Delivery Indicators

- Presence: Online / Idle / Offline with timestamps
- Delivery:
  - Sending
  - Retrying with exponential backoff
  - Delivered

Messages persist locally and retry on reconnect

---

## Performance Notes

- < 60 KB gzipped bundle
- Terminal-style UI; no fonts or images
- Service Worker enables offline reload
- Chunked messaging for bandwidth smoothing
- No dependencies or runtime configuration

---

## Room Retirement

- When all peers are offline, room can be retired
- Retiring zeroizes keys and halts delivery
- No data stored on servers—cryptographic deletion is complete

---

## Limitations

- No STUN/TURN = P2P may not work on strict NATs
- Larger rooms increase connection complexity
- Use at your own risk—no formal security audit

---

## Privacy and Accessibility

- Fully keyboard accessible
- No third-party requests
- No cookies; local storage only

---

## Quick Start

1. Copy `/scs` to your website
2. Visit `/scs` and create a room
3. Share the URL
4. Peer joins and completes handshake
5. Chat begins
6. Optionally retire room when done

---

## License

MIT License

---

## Contributing

- Issues and bug reports welcome
- Pull requests must preserve serverless design and minimal 
