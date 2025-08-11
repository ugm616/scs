// UUID for room generation
export function generateUUID() {
  return crypto.randomUUID();
}

// Base64 encoding that's URL-safe
export function encodeBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeBase64(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

// Wait wrapper
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
