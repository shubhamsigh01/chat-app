/*
 * crypto.js
 * All Web Crypto API helpers for ECDH key generation, public key
 * import/export, shared key derivation, AES-GCM encrypt and decrypt.
 * Runs in the browser only — never imported server-side.
 */

const ECDH_PARAMS = { name: 'ECDH', namedCurve: 'P-256' }
const AES_PARAMS  = { name: 'AES-GCM', length: 256 }

export async function generateKeyPair() {
  return crypto.subtle.generateKey(ECDH_PARAMS, true, ['deriveKey'])
}

export async function exportPublicKey(publicKey) {
  const raw = await crypto.subtle.exportKey('spki', publicKey)
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
}

export async function importPublicKey(base64) {
  const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  return crypto.subtle.importKey('spki', binary, ECDH_PARAMS, true, [])
}

export async function deriveSharedKey(myPrivateKey, theirPublicKey) {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    AES_PARAMS,
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptMessage(sharedKey, plaintext) {
  const iv      = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const buf     = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, encoded)
  return {
    iv:         btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(buf)))
  }
}

export async function decryptMessage(sharedKey, { iv, ciphertext }) {
  const ivBytes  = Uint8Array.from(atob(iv),         c => c.charCodeAt(0))
  const ctBytes  = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
  const buf      = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, sharedKey, ctBytes)
  return new TextDecoder().decode(buf)
}
