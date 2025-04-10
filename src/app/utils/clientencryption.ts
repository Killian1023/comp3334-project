import { importJWK, CompactEncrypt, compactDecrypt } from 'jose';
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

