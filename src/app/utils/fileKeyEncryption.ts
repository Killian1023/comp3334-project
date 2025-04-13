/**
 * File Key Encryption Utilities
 * Using ECC elliptic curve encryption/decryption for file keys
 */

import { importJWK, CompactEncrypt, compactDecrypt, JWK } from 'jose';

/**
 * Encrypt file key using public key
 * @param fileKey File key (Base64 format)
 * @param publicKeyBase64 Public key (Base64 format)
 * @returns Encrypted file key (Base64 format)
 */
export async function encryptFileKey(fileKey: string, publicKeyBase64: string): Promise<string> {
  try {
    // Parse public key
    const publicKeyJwk = JSON.parse(atob(publicKeyBase64));
    
    // Import elliptic curve public key using ECDH-ES
    const publicKey = await importJWK(publicKeyJwk, 'ECDH-ES');
    
    // Encode file key
    const encoder = new TextEncoder();
    const fileKeyBuffer = encoder.encode(fileKey);
    
    // Encrypt file key using ECDH-ES
    const jwe = await new CompactEncrypt(fileKeyBuffer)
      .setProtectedHeader({ alg: 'ECDH-ES', enc: 'A256GCM' })
      .encrypt(publicKey);
    
    console.log('File key encryption successful');
    return jwe;
  } catch (error) {
    console.error('File key encryption failed:', error);
    throw new Error('Unable to encrypt file key');
  }
}

/**
 * Decrypt file key using private key
 * @param encryptedFileKey Encrypted file key (JWE format)
 * @param privateKeyBase64 Private key (Base64 format)
 * @returns Decrypted file key (Base64 format)
 */
export async function decryptFileKey(encryptedFileKey: string, privateKeyBase64: string): Promise<string> {
  try {
    
    // Parse private key
    const privateKeyJwk = JSON.parse(atob(privateKeyBase64));
    
    // Import elliptic curve private key using ECDH-ES
    const privateKey = await importJWK(privateKeyJwk, 'ECDH-ES');
    console.log('Private key import successful');
    
    // Decrypt file key
    const { plaintext } = await compactDecrypt(encryptedFileKey, privateKey);
    
    // Convert decrypted data to string
    const decoder = new TextDecoder();
    const decryptedFileKey = decoder.decode(plaintext);
    
    console.log('File key decryption successful');
    return decryptedFileKey;
  } catch (error) {
    console.error('File key decryption failed:', error);
    throw new Error('Unable to decrypt file key');
  }
}

/**
 * Import ECC public key from Base64 string
 * @param publicKeyBase64 Base64 encoded public key
 * @returns Imported public key object
 */
export async function importECCPublicKey(publicKeyBase64: string): Promise<any> {
  try {
    // Parse Base64 encoded public key
    const publicKeyJwk = JSON.parse(atob(publicKeyBase64));
    
    // Import elliptic curve public key using ECDH-ES instead of ES256
    return await importJWK(publicKeyJwk, 'ECDH-ES');
  } catch (error) {
    console.error('ECC public key import failed:', error);
    throw new Error('Unable to import ECC public key');
  }
}

/**
 * Import ECC private key from Base64 string
 * @param privateKeyBase64 Base64 encoded private key
 * @returns Imported private key object
 */
export async function importECCPrivateKey(privateKeyBase64: string): Promise<any> {
  try {
    // Parse Base64 encoded private key
    const privateKeyJwk = JSON.parse(atob(privateKeyBase64));
    
    // Import elliptic curve private key using ECDH-ES instead of ES256
    return await importJWK(privateKeyJwk, 'ECDH-ES');
  } catch (error) {
    console.error('ECC private key import failed:', error);
    throw new Error('Unable to import ECC private key');
  }
}

/**
 * Encrypt file key using existing ECC key pair
 * @param fileKey Original file key
 * @param userPublicKey User's public key
 * @returns File key encrypted for specific user
 */
export async function encryptFileKeyForUser(fileKey: string, userPublicKey: string): Promise<string> {
  return await encryptFileKey(fileKey, userPublicKey);
}

/**
 * Get current user's own public key
 * @returns Current user's public key
 */
export function getCurrentUserPublicKey(): string | null {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.publicKey) {
      console.error('Current user\'s public key not found');
      return null;
    }
    return user.publicKey;
  } catch (error) {
    console.error('Failed to get current user\'s public key:', error);
    return null;
  }
}

/**
 * Get current user's own private key
 * @returns Current user's private key
 */
export function getCurrentUserPrivateKey(): string | null {
  const privateKey = localStorage.getItem('privateKey');
  if (!privateKey) {
    console.error('Current user\'s private key not found');
    return null;
  }
  return privateKey;
}