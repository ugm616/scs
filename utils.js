// UUID for identities
export function generateUUID() {
  return crypto.randomUUID();
}

// Random bytes
export function randomBytes(len) {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return b;
}

// URL-safe Base64 encode/decode for Uint8Array/ArrayBuffer
export function encodeBase64(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : new Uint8Array(buf.buffer ?? buf);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
}

export function decodeBase64(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function textToBytes(s) { return new TextEncoder().encode(s); }
export function bytesToText(b) { return new TextDecoder().decode(b); }

// Sleep
export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Compact room id (base36)
export function generateRoomId(len = 6) {
  const n = (crypto.getRandomValues(new Uint32Array(1))[0] >>> 0).toString(36);
  return n.slice(0, len).toUpperCase();
}

// Parse and update URL hash parameters (#r=...&k=...)
export function parseHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  return { r: h.get('r') || '', k: h.get('k') || '' };
}
export function setHash(params) {
  const h = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) h.set(k, v);
  history.replaceState(null, '', '#' + h.toString());
}
