/**
 * Ensures encryption keys are generated and stored for the user
 * Uses both userId and password to derive a secure encryption key
 * 
 * @param userId - The user's ID
 * @param password - The user's password for additional entropy
 */
export const ensureEncryptionKeys = async (userId: string, password: string): Promise<void> => {
  try {
    const keyIdentifier = `encryptionKey_${userId}`;
    
    // Check if keys already exist
    if (!localStorage.getItem(keyIdentifier)) {
      // Create a key material from the password and userId
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password + userId);
      
      // Use the password as key material
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        passwordData,
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );
      
      // Generate a salt based on userId
      const salt = encoder.encode(userId.padEnd(16, '0').slice(0, 16));
      
      // Derive the actual key using PBKDF2
      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: 100000,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      
      // Export the key to store it
      const exportedKey = await window.crypto.subtle.exportKey("raw", key);
      const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
      
      console.log('Generated encryption key derived from password for user:', userId);
      localStorage.setItem(keyIdentifier, keyBase64);
    }
  } catch (error) {
    console.error('Failed to generate encryption keys:', error);
  }
};
