# Staggered Chat System (SCS)

A fully serverless, portable, end‑to‑end encrypted chat system built from pure static files. No accounts. No backend. Just chat—anywhere HTML can run.

SCS creates peer-to-peer chat “rooms” via manual handshake. Ideal for weak networks, off-grid setups, and private communication.

---

scs/
├── index.html          # Minimal UI with header, input, messages

├── style.css           # Lightweight optional styling

├── main.js             # Orchestrates signaling + encryption

├── crypto.js           # AES-GCM + HKDF utils

├── signaling.js        # Manual signaling via URL/QR

├── fallback.js         # Handles unstable/slow connections

├── utils.js            # URL-safe base64, UUID, timers

├── README.md           # Documentation & walkthrough
