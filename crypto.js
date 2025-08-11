import { textToBytes, encodeBase64, decodeBase64, randomBytes } from './utils.js';

// HKDF derive an AES-GCM key from a secret (32 bytes)
export async function deriveAesGcmKey(secretRawBytes, info = 'msg-v1', saltBytes = new Uint8Array(32)) {
  const keyMaterial = await crypto.subtle.importKey('raw', secretRawBytes, 'HKDF', false, ['deriveKey', 'deriveBits']);
  const key = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: saltBytes, info: textToBytes(info) },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return key;
}

export async function aesGcmEncrypt(key, plaintextBytes, aadBytes) {
  const iv = randomBytes(12);
  const alg = { name: 'AES-GCM', iv, additionalData: aadBytes };
  const ct = await crypto.subtle.encrypt(alg, key, plaintextBytes);
  return { iv, ct: new Uint8Array(ct) };
}

export async function aesGcmDecrypt(key, iv, ciphertextBytes, aadBytes) {
  const alg = { name: 'AES-GCM', iv, additionalData: aadBytes };
  const pt = await crypto.subtle.decrypt(alg, key, ciphertextBytes);
  return new Uint8Array(pt);
}

// Encrypt a JSON object with AES-GCM, return compact base64 package
export async function sealJson(key, obj, aadStr = '') {
  const pt = textToBytes(JSON.stringify(obj));
  const aad = aadStr ? textToBytes(aadStr) : undefined;
  const { iv, ct } = await aesGcmEncrypt(key, pt, aad);
  return {
    v: 1,
    n: encodeBase64(iv),
    c: encodeBase64(ct),
  };
}

// Decrypt a sealed package back to JSON object
export async function openJson(key, pkg, aadStr = '') {
  const iv = decodeBase64(pkg.n);
  const ct = decodeBase64(pkg.c);
  const aad = aadStr ? textToBytes(aadStr) : undefined;
  const pt = await aesGcmDecrypt(key, iv, ct, aad);
  return JSON.parse(new TextDecoder().decode(pt));
}
