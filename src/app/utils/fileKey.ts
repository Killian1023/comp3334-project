/**
 * 為文件生成加密所需的 fileKey 和 IV
 * @returns 包含 fileKey 和 IV 的物件，均為 Base64 編碼的字串
 */
export function generateFileKeyAndIV(): { fileKey: string; iv: string } {
    // 生成一個 32 位元組（256 位元）的隨機 fileKey，適用於 AES-256
    const fileKey = window.crypto.getRandomValues(new Uint8Array(32));
    
    // 生成一個 16 位元組（128 位元）的隨機 IV，適用於大多數加密模式（如 AES-CBC, AES-GCM）
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    
    // 將 Uint8Array 轉換為 Base64 字串
    const fileKeyBase64 = bufferToBase64(fileKey);
    const ivBase64 = bufferToBase64(iv);
    
    return {
      fileKey: fileKeyBase64,
      iv: ivBase64
    };
  }
  
  /**
   * 將 Uint8Array 轉換為 Base64 字串
   * @param buffer - 要轉換的 Uint8Array
   * @returns Base64 編碼的字串
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
   * 將 Base64 字串轉換回 Uint8Array
   * @param base64 - Base64 編碼的字串
   * @returns 解碼後的 Uint8Array
   */
  export function base64ToBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }