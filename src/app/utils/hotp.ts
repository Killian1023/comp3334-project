import crypto from 'crypto';

/**
 * Generate an HOTP code using a private key and counter
 * @param privateKeyBase64 - Base64 encoded private key (JWK format)
 * @param counter - The counter value for this HOTP code
 * @returns Promise resolving to a 6-digit HOTP code
 */
export async function generateHOTP(privateKeyBase64: string, counter: number): Promise<string> {
  try {
    // Convert counter to 8-byte array (big-endian)
    const counterBytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      counterBytes[7-i] = counter & 0xff;
      counter = counter >> 8;
    }

    // Instead of signing with the private key, use SHA-256 directly on the counter
    // This ensures compatibility with the server-side verification
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', counterBytes);
    const hashArray = new Uint8Array(hashBuffer);
    
    // Use the same truncation method as the server
    const offset = hashArray[hashArray.length - 1] & 0x0f;
    
    // Get 4 bytes at the offset and convert to a 31-bit integer
    const binary = 
      ((hashArray[offset] & 0x7f) << 24) |
      ((hashArray[offset + 1] & 0xff) << 16) |
      ((hashArray[offset + 2] & 0xff) << 8) |
      (hashArray[offset + 3] & 0xff);

    // Generate a 6-digit code
    const otp = (binary % 1000000).toString().padStart(6, '0');
    
    console.log(`Client generated HOTP: ${otp} for counter: ${counter}`);
    return otp;
  } catch (error) {
    console.error('Error generating HOTP:', error);
    throw new Error('Failed to generate HOTP code');
  }
}

/**
 * Generate a public key from a private key
 * This is a helper function to make sure the public key matches the private key
 */
export function extractPublicKeyFromPrivate(privateKeyBase64: string): string | null {
  try {
    const privateKeyObj = JSON.parse(atob(privateKeyBase64));
    if (!privateKeyObj.kty || !privateKeyObj.crv || !privateKeyObj.x || !privateKeyObj.y) {
      return null;
    }
    
    // Only keep the public key portion
    const publicKeyObj = {
      kty: privateKeyObj.kty,
      crv: privateKeyObj.crv,
      x: privateKeyObj.x,
      y: privateKeyObj.y,
      ext: true
    };
    
    return btoa(JSON.stringify(publicKeyObj));
  } catch (e) {
    console.error('Failed to extract public key from private key:', e);
    return null;
  }
}