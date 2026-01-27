/**
 * Cryptographic Utilities for Pharmaceutical Blockchain
 * Implements SHA-256 hashing, digital signatures, and key management
 */

/**
 * Generate SHA-256 hash of data
 * @param {string|object} data - Data to hash
 * @returns {Promise<string>} - Hex string of hash
 */
export async function sha256(data) {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a cryptographic key pair for digital signatures
 * @returns {Promise<CryptoKeyPair>}
 */
export async function generateKeyPair() {
  return await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );
}

/**
 * Export public key to storable format
 * @param {CryptoKey} publicKey
 * @returns {Promise<string>}
 */
export async function exportPublicKey(publicKey) {
  const exported = await crypto.subtle.exportKey("spki", publicKey);
  return arrayBufferToBase64(exported);
}

/**
 * Export private key to storable format
 * @param {CryptoKey} privateKey
 * @returns {Promise<string>}
 */
export async function exportPrivateKey(privateKey) {
  const exported = await crypto.subtle.exportKey("pkcs8", privateKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import public key from stored format
 * @param {string} keyData - Base64 encoded key
 * @returns {Promise<CryptoKey>}
 */
export async function importPublicKey(keyData) {
  const keyBuffer = base64ToArrayBuffer(keyData);
  return await crypto.subtle.importKey(
    "spki",
    keyBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );
}

/**
 * Import private key from stored format
 * @param {string} keyData - Base64 encoded key
 * @returns {Promise<CryptoKey>}
 */
export async function importPrivateKey(keyData) {
  const keyBuffer = base64ToArrayBuffer(keyData);
  return await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );
}

/**
 * Sign data with private key
 * @param {string|object} data - Data to sign
 * @param {CryptoKey} privateKey - Private key for signing
 * @returns {Promise<string>} - Base64 encoded signature
 */
export async function signData(data, privateKey) {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(text);

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    dataBuffer
  );

  return arrayBufferToBase64(signature);
}

/**
 * Verify signature with public key
 * @param {string|object} data - Original data
 * @param {string} signature - Base64 encoded signature
 * @param {CryptoKey} publicKey - Public key for verification
 * @returns {Promise<boolean>}
 */
export async function verifySignature(data, signature, publicKey) {
  try {
    const text = typeof data === "string" ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(text);
    const signatureBuffer = base64ToArrayBuffer(signature);

    return await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      signatureBuffer,
      dataBuffer
    );
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

/**
 * Generate a random nonce
 * @returns {string}
 */
export function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a unique transaction ID
 * @param {string} prefix - Optional prefix
 * @returns {string}
 */
export function generateTransactionId(prefix = "tx") {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  const nonce = generateNonce().substring(0, 8);
  return `${prefix}-${timestamp}-${random}-${nonce}`;
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Hash pair of values for Merkle tree
 * @param {string} left
 * @param {string} right
 * @returns {Promise<string>}
 */
export async function hashPair(left, right) {
  return await sha256(left + right);
}

/**
 * Create a deterministic hash from block data
 * @param {object} blockData
 * @returns {Promise<string>}
 */
export async function calculateBlockHash(blockData) {
  const dataToHash = {
    blockNumber: blockData.blockNumber,
    timestamp: blockData.timestamp,
    previousHash: blockData.previousHash,
    merkleRoot: blockData.merkleRoot,
    nonce: blockData.nonce,
    difficulty: blockData.difficulty,
    minedBy: blockData.minedBy,
    facilityId: blockData.facilityId,
  };
  return await sha256(dataToHash);
}

export default {
  sha256,
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  signData,
  verifySignature,
  generateNonce,
  generateTransactionId,
  hashPair,
  calculateBlockHash,
};
