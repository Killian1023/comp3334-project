import { v4 as uuidv4 } from 'uuid';

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
export const decryptFile = async (
  encryptedData: ArrayBuffer,
  ivBase64: string,
  encryptedName: string,
  userId: string
): Promise<{ decryptedData: ArrayBuffer; filename: string }> => {
  try {
    console.log('Starting decryption process...');
    console.log('IV base64 length:', ivBase64.length);
    console.log('Encrypted name length:', encryptedName.length);
    console.log('Encrypted data size:', encryptedData.byteLength);
    
    // Get the encryption key
    const key = await getEncryptionKey(userId);
    console.log('Retrieved encryption key successfully');
    
    // Convert IV from base64 back to Uint8Array using our helper function
    let ivArray;
    try {
      ivArray = base64ToIV(ivBase64);
      console.log('IV array length after decoding:', ivArray.length);
    } catch (error) {
      console.error('Error parsing IV:', error);
      throw new Error('Invalid IV format');
    }
    
    // Decrypt the file content
    let decryptedData;
    try {
      decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivArray
        },
        key,
        encryptedData
      );
      console.log('File decrypted successfully');
    } catch (decryptError) {
      console.error('Decryption operation failed:', decryptError);
      throw new Error('Failed to decrypt file content');
    }
    
    // Decrypt the filename
    let filename;
    try {
      const encryptedFilenameData = Uint8Array.from(atob(encryptedName), c => c.charCodeAt(0));
      const decryptedFilenameData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivArray
        },
        key,
        encryptedFilenameData.buffer
      );
      
      // Convert decrypted filename back to string
      const decoder = new TextDecoder();
      filename = decoder.decode(decryptedFilenameData);
      console.log('Filename decrypted successfully:', filename);
    } catch (nameError) {
      console.error('Filename decryption failed:', nameError);
      // Generate a safe default filename if we can't decrypt the original
      filename = `decrypted-file-${new Date().getTime()}`;
    }
    
    return { decryptedData, filename };
  } catch (error) {
    console.error('File decryption failed:', error);
    throw new Error('Failed to decrypt file. The encryption key may be invalid.');
  }
};

/**
 * Prepare form data with encrypted file for upload
 */
export const prepareEncryptedFormData = async (file: File, userId: string): Promise<FormData> => {
  const { encryptedData, iv, encryptedName } = await encryptFile(file, userId);
  
  // Create a new file with encrypted data
  const encryptedFile = new File(
    [encryptedData], 
    file.name, // We use original filename here, but it won't be stored as-is
    { type: 'application/octet-stream' }
  );
  
  const formData = new FormData();
  formData.append('file', encryptedFile);
  formData.append('iv', iv);
  formData.append('encryptedName', encryptedName);
  formData.append('originalType', file.type);
  formData.append('size', file.size.toString());
  
  return formData;
};

/**
 * Handle file download and decryption
 */
export const downloadAndDecryptFile = async (fileId: string, userId: string): Promise<void> => {
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
    const response = await fetch(`/api/files/download?id=${fileId}`, {
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
    const encryptedName = response.headers.get('X-Encrypted-Name');
    
    console.log('Headers received:', { 
      iv: iv ? `${iv.substring(0, 10)}...` : 'missing',
      encryptedName: encryptedName ? `${encryptedName.substring(0, 10)}...` : 'missing'
    });
    
    if (!iv || !encryptedName) {
      throw new Error('Missing encryption metadata in server response');
    }
    
    // Decrypt the file using our improved helper functions
    const { decryptedData, filename } = await decryptFile(
      await fileData.arrayBuffer(),
      iv,
      encryptedName,
      userId
    );
    
    // Create a download link for the decrypted file
    const blob = new Blob([decryptedData]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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
