/**
 * Generate fileKey and IV required for file encryption
 * @returns An object containing fileKey and IV, both as Base64 encoded strings
 */
export function generateFileKeyAndIV(): { fileKey: string; iv: string } {
    // Generate a random 32-byte (256-bit) fileKey, suitable for AES-256
    const fileKey = window.crypto.getRandomValues(new Uint8Array(32));
    
    // Generate a random 16-byte (128-bit) IV, suitable for most encryption modes (like AES-CBC, AES-GCM)
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    
    // Convert Uint8Array to Base64 string
    const fileKeyBase64 = bufferToBase64(fileKey);
    const ivBase64 = bufferToBase64(iv);
    
    return {
      fileKey: fileKeyBase64,
      iv: ivBase64
    };
  }
  
  /**
   * Convert Uint8Array to Base64 string
   * @param buffer - Uint8Array to be converted
   * @returns Base64 encoded string
   */
  export function bufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }
  
  /**
   * Convert Base64 string back to Uint8Array
   * @param base64 - Base64 encoded string
   * @returns Decoded Uint8Array
   */
  export function base64ToBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }