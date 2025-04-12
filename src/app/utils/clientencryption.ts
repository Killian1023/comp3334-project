import { importJWK, CompactEncrypt, compactDecrypt, SignJWT, jwtVerify } from 'jose';
import { base64ToBuffer, bufferToBase64 } from './fileKey';

import { generateKeyPair, exportJWK } from 'jose';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export async function generateKeyPairECC(): Promise<KeyPair> {
  try {
    // 使用P-256椭圆曲线和ECDH算法生成密钥对，适用于加密而不是签名
    const { publicKey, privateKey } = await generateKeyPair('ECDH-ES', {
      crv: 'P-256',
      extractable: true
    });
    
    const publicKeyJwk = await exportJWK(publicKey);
    const privateKeyJwk = await exportJWK(privateKey);
    
    if (!publicKeyJwk.x || !publicKeyJwk.y || !privateKeyJwk.d) {
      throw new Error('Invalid key format generated');
    }
    
    const publicKeyBase64 = btoa(JSON.stringify({
      kty: publicKeyJwk.kty,
      crv: publicKeyJwk.crv,
      x: publicKeyJwk.x,
      y: publicKeyJwk.y
    }));
    
    const privateKeyBase64 = btoa(JSON.stringify({
      kty: privateKeyJwk.kty,
      crv: privateKeyJwk.crv,
      x: privateKeyJwk.x,
      y: privateKeyJwk.y,
      d: privateKeyJwk.d
    }));
    
    return {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64
    };
  } catch (error) {
    console.error('Failed to generate key pair:', error);
    throw new Error('Failed to generate key pair');
  }
}

// Generate a key pair suitable for digital signatures
export async function generateSigningKeyPair(): Promise<KeyPair> {
  try {
    // Use ES256 (ECDSA with P-256 curve and SHA-256) for digital signatures
    const { publicKey, privateKey } = await generateKeyPair('ES256', {
      extractable: true
    });
    
    const publicKeyJwk = await exportJWK(publicKey);
    const privateKeyJwk = await exportJWK(privateKey);
    
    const publicKeyBase64 = btoa(JSON.stringify(publicKeyJwk));
    const privateKeyBase64 = btoa(JSON.stringify(privateKeyJwk));
    
    return {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64
    };
  } catch (error) {
    console.error('Failed to generate signing key pair:', error);
    throw new Error('Failed to generate signing key pair');
  }
}

// Sign an action to provide non-repudiation
export const signAction = async (action: string, privateKey: string): Promise<string> => {
  try {
    // Add the algorithm parameter to importJWK
    const privateKeyObj = await importJWK(JSON.parse(atob(privateKey)), 'ES256');
    
    // Create a JWT with the action data
    const jwt = await new SignJWT({ action })
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(privateKeyObj);
    
    return jwt;
  } catch (error) {
    console.error('Failed to sign action:', error);
    throw new Error('Failed to sign action');
  }
}