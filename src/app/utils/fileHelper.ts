import { v4 as uuidv4 } from 'uuid';
import { generateFileKeyAndIV, bufferToBase64, base64ToBuffer } from './fileKey';
import { encryptFileKey, getCurrentUserPublicKey, decryptFileKey, getCurrentUserPrivateKey } from './fileKeyEncryption';

/**
 * Client-side file encryption utilities for secure file handling
 */

/**
 * Get the encryption key for the current user
 */
export const getEncryptionKey = async (userId: string): Promise<CryptoKey> => {
  const storedKey = localStorage.getItem(`encryptionKey_${userId}`);
  
  if (!storedKey) {
    throw new Error('Encryption key not found. Please log in again.');
  }
  
  try {
    // Convert the base64 key back to a CryptoKey
    const keyData = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
    
    return window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Error importing encryption key:', error);
    throw new Error('Failed to process encryption key. Please log in again.');
  }
};

/**
 * Generate a random initialization vector for AES-GCM
 */
export const generateIV = (): Uint8Array => {
  // Always use 12 bytes for AES-GCM as recommended
  return window.crypto.getRandomValues(new Uint8Array(12));
};

/**
 * Convert IV to base64 for storage
 */
export const ivToBase64 = (iv: Uint8Array): string => {
  return btoa(String.fromCharCode.apply(null, Array.from(iv)));
};

/**
 * Convert base64 IV back to Uint8Array
 */
export const base64ToIV = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Encrypt a file before uploading
 */
export const encryptFile = async (
  file: File, 
  userId: string
): Promise<{ encryptedData: ArrayBuffer; iv: string; encryptedName: string }> => {
  try {
    const key = await getEncryptionKey(userId);
    const iv = generateIV();
    console.log('Generated IV for encryption, length:', iv.length);
    
    // Read the file as ArrayBuffer
    const fileContent = await file.arrayBuffer();
    
    // Encrypt the file content
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      fileContent
    );
    
    // Also encrypt the filename for extra security
    const encoder = new TextEncoder();
    const filenameData = encoder.encode(file.name);
    const encryptedFilenameData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      filenameData
    );
    
    // Convert the encrypted filename to Base64 for storage
    const encryptedName = btoa(String.fromCharCode(...new Uint8Array(encryptedFilenameData)));
    
    // Convert IV to base64 for storage using our helper function
    const ivBase64 = ivToBase64(iv);
    console.log('Converted IV to base64 for upload:', ivBase64);
    
    return {
      encryptedData,
      iv: ivBase64,
      encryptedName
    };
  } catch (error) {
    console.error('File encryption failed:', error);
    throw new Error('Failed to encrypt file. Please try again.');
  }
};

/**
 * Decrypt a file after downloading
 */
export const downloadAndDecryptFile = async (fileId: string, userId: string, isShare?: string): Promise<void> => {
  try {
    // Get authentication token
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    console.log(`Attempting to download file: ${fileId}`);
    
    // Create headers with authorization
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${token}`);
    
    // Fetch the encrypted file and metadata with authorization header
    const response = await fetch(`/api/files/download?id=${fileId}&isShare=${isShare}`, {
      method: 'GET',
      headers: headers,
      credentials: 'same-origin' // Include cookies and HTTP auth credentials
    });
    
    console.log('Download response status:', response.status);
    
    if (!response.ok) {
      // Try to parse error response
      let errorMessage = 'Failed to download file';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If parsing fails, use default message
      }
      throw new Error(errorMessage);
    }
    
    // Continue with file processing after successful download
    const fileData = await response.blob();
    console.log('File blob received, size:', fileData.size);
    
    const iv = response.headers.get('X-Encryption-IV');
    const encryptedFileKey = response.headers.get('X-File-Key');  // 获取加密的文件密钥
    const originalName = response.headers.get('X-Original-Name'); // 获取原始文件名而不是加密的文件名
    
    console.log('Headers received:', { 
      iv: iv ? `${iv.substring(0, 10)}...` : 'missing',
      encryptedFileKey: encryptedFileKey ? 'present' : 'missing',
      originalName: originalName || 'missing'
    });
    
    if (!iv || !originalName || !encryptedFileKey) {
      throw new Error('Missing encryption metadata in server response');
    }
    
    // 获取用户私钥
    const privateKey = getCurrentUserPrivateKey();
    if (!privateKey) {
      throw new Error('Private key not found. Please log in again.');
    }
    
    // 使用私钥解密文件密钥
    const fileKey = await decryptFileKey(encryptedFileKey, privateKey);
    console.log('File key successfully decrypted');
    // 测试用途：输出解密后的文件密钥
    console.log('解密后的文件密钥（测试用途）:', fileKey);
    
    // 使用解密后的文件密钥解密文件内容（不需要解密文件名）
    const decryptedData = await decryptFileContent(
      await fileData.arrayBuffer(),
      iv,
      fileKey
    );
    
    // Create a download link for the decrypted file
    const blob = new Blob([decryptedData]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = originalName; // 使用原始文件名
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    console.log('File download initiated');
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

/**
 * 只解密文件内容
 */
export const decryptFileContent = async (
  encryptedData: ArrayBuffer,
  ivBase64: string,
  fileKey: string
): Promise<ArrayBuffer> => {
  try {
    console.log('Starting decryption with file key...');
    
    // Convert IV from base64 back to Uint8Array
    const ivArray = base64ToBuffer(ivBase64);
    
    // Convert fileKey from string to buffer and import it as a CryptoKey
    const fileKeyArray = base64ToBuffer(fileKey);
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      fileKeyArray,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt the file content
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivArray
      },
      cryptoKey,
      encryptedData
    );
    
    console.log('File content decrypted successfully');
    return decryptedData;
  } catch (error) {
    console.error('File decryption failed:', error);
    throw new Error('Failed to decrypt file. The file key may be invalid.');
  }
};

/**
 * 使用独立文件密钥加密文件以便上传
 * @param file - 要加密的文件
 * @returns 包含加密数据、文件密钥和IV的对象
 */
export const encryptFileForUpload = async (file: File): Promise<{
  encryptedData: ArrayBuffer;
  fileKey: string;
  iv: string;
  originalName: string;
  originalType: string;
  size: number;
}> => {
  try {
    // 使用fileKey.ts中的函数生成文件密钥和IV
    const { fileKey, iv } = generateFileKeyAndIV();
    const ivArray = base64ToBuffer(iv);
    const fileKeyArray = base64ToBuffer(fileKey);
    
    // 读取文件内容
    const fileContent = await file.arrayBuffer();
    
    // 从fileKey导入加密密钥
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      fileKeyArray,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    // 加密文件内容
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivArray
      },
      cryptoKey,
      fileContent
    );
    
    // 不再加密文件名，直接使用原始文件名
    const originalName = file.name;
    
    return {
      encryptedData,
      fileKey,
      iv,
      originalName,
      originalType: file.type,
      size: file.size
    };
  } catch (error) {
    console.error('文件加密失败:', error);
    throw new Error('无法加密文件。请重试。');
  }
};

/**
 * 准备加密文件的FormData用于上传（使用独立且加密的文件密钥）
 */
export const prepareEncryptedFileUpload = async (file: File): Promise<FormData> => {
  // 获取加密的文件数据和原始密钥
  const { encryptedData, fileKey, iv, originalName, originalType, size } = await encryptFileForUpload(file);
  
  // 测试用途：输出文件密钥信息
  console.log('原始文件密钥（测试）:', fileKey);
  console.log('IV（测试）:', iv);
  
  // 获取当前用户的公钥
  const publicKey = getCurrentUserPublicKey();
  if (!publicKey) {
    throw new Error('无法获取用户公钥，请重新登录');
  }
  
  // 使用用户的公钥加密文件密钥
  const encryptedFileKey = await encryptFileKey(fileKey, publicKey);
  console.log('文件密钥已使用用户公钥加密');
  
  // 创建一个包含加密数据的新文件
  const encryptedFile = new File(
    [encryptedData], 
    `encrypted_${Date.now()}`,
    { type: 'application/octet-stream' }
  );
  
  const formData = new FormData();
  formData.append('file', encryptedFile);
  formData.append('fileKey', encryptedFileKey); // 使用加密后的文件密钥
  formData.append('iv', iv);
  formData.append('originalName', originalName);
  formData.append('originalType', originalType);
  formData.append('size', size.toString());
  
  return formData;
};
