/**
 * 文件密钥加密工具
 * 使用ECC椭圆曲线加密/解密文件密钥
 */

import { importJWK, CompactEncrypt, compactDecrypt, JWK } from 'jose';

/**
 * 使用公钥加密文件密钥
 * @param fileKey 文件密钥（Base64格式）
 * @param publicKeyBase64 公钥（Base64格式）
 * @returns 加密后的文件密钥（Base64格式）
 */
export async function encryptFileKey(fileKey: string, publicKeyBase64: string): Promise<string> {
  try {
    // 解析公钥
    const publicKeyJwk = JSON.parse(atob(publicKeyBase64));
    
    // 导入椭圆曲线公钥，使用ECDH-ES
    const publicKey = await importJWK(publicKeyJwk, 'ECDH-ES');
    
    // 编码文件密钥
    const encoder = new TextEncoder();
    const fileKeyBuffer = encoder.encode(fileKey);
    
    // 使用ECDH-ES加密文件密钥
    const jwe = await new CompactEncrypt(fileKeyBuffer)
      .setProtectedHeader({ alg: 'ECDH-ES', enc: 'A256GCM' })
      .encrypt(publicKey);
    
    console.log('文件密钥加密成功');
    // 测试用途：输出原始文件密钥
    console.log('原始文件密钥（测试用途）:', fileKey);
    console.log('加密后的文件密钥（测试用途）:', jwe);
    return jwe;
  } catch (error) {
    console.error('文件密钥加密失败:', error);
    throw new Error('无法加密文件密钥');
  }
}

/**
 * 使用私钥解密文件密钥
 * @param encryptedFileKey 加密后的文件密钥（JWE格式）
 * @param privateKeyBase64 私钥（Base64格式）
 * @returns 解密后的文件密钥（Base64格式）
 */
export async function decryptFileKey(encryptedFileKey: string, privateKeyBase64: string): Promise<string> {
  try {
    // 测试用途：输出加密的文件密钥
    console.log('加密的文件密钥（测试用途）:', encryptedFileKey.substring(0, 20) + '...');
    
    // 解析私钥
    const privateKeyJwk = JSON.parse(atob(privateKeyBase64));
    console.log('私钥JWK格式（测试用途）:', { 
      kty: privateKeyJwk.kty, 
      crv: privateKeyJwk.crv,
      keyHasD: !!privateKeyJwk.d
    });
    
    // 导入椭圆曲线私钥，使用ECDH-ES
    const privateKey = await importJWK(privateKeyJwk, 'ECDH-ES');
    console.log('私钥导入成功');
    
    // 解密文件密钥
    const { plaintext } = await compactDecrypt(encryptedFileKey, privateKey);
    
    // 将解密后的数据转换为字符串
    const decoder = new TextDecoder();
    const decryptedFileKey = decoder.decode(plaintext);
    
    console.log('文件密钥解密成功');
    console.log('解密后的文件密钥（测试用途）:', decryptedFileKey);
    return decryptedFileKey;
  } catch (error) {
    console.error('文件密钥解密失败:', error);
    throw new Error('无法解密文件密钥');
  }
}

/**
 * 从Base64字符串导入ECC公钥
 * @param publicKeyBase64 Base64编码的公钥
 * @returns 导入的公钥对象
 */
export async function importECCPublicKey(publicKeyBase64: string): Promise<any> {
  try {
    // 解析Base64编码的公钥
    const publicKeyJwk = JSON.parse(atob(publicKeyBase64));
    
    // 导入椭圆曲线公钥，使用ECDH-ES而不是ES256
    return await importJWK(publicKeyJwk, 'ECDH-ES');
  } catch (error) {
    console.error('导入ECC公钥失败:', error);
    throw new Error('无法导入ECC公钥');
  }
}

/**
 * 从Base64字符串导入ECC私钥
 * @param privateKeyBase64 Base64编码的私钥
 * @returns 导入的私钥对象
 */
export async function importECCPrivateKey(privateKeyBase64: string): Promise<any> {
  try {
    // 解析Base64编码的私钥
    const privateKeyJwk = JSON.parse(atob(privateKeyBase64));
    
    // 导入椭圆曲线私钥，使用ECDH-ES而不是ES256
    return await importJWK(privateKeyJwk, 'ECDH-ES');
  } catch (error) {
    console.error('导入ECC私钥失败:', error);
    throw new Error('无法导入ECC私钥');
  }
}

/**
 * 使用现有的ECC密钥对加密文件密钥
 * @param fileKey 原始文件密钥
 * @param userPublicKey 用户的公钥
 * @returns 为特定用户加密的文件密钥
 */
export async function encryptFileKeyForUser(fileKey: string, userPublicKey: string): Promise<string> {
  return await encryptFileKey(fileKey, userPublicKey);
}

/**
 * 获取当前用户自己的公钥
 * @returns 当前用户的公钥
 */
export function getCurrentUserPublicKey(): string | null {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.publicKey) {
      console.error('找不到当前用户的公钥');
      return null;
    }
    return user.publicKey;
  } catch (error) {
    console.error('获取当前用户公钥失败:', error);
    return null;
  }
}

/**
 * 获取当前用户自己的私钥
 * @returns 当前用户的私钥
 */
export function getCurrentUserPrivateKey(): string | null {
  const privateKey = localStorage.getItem('privateKey');
  if (!privateKey) {
    console.error('找不到当前用户的私钥');
    return null;
  }
  return privateKey;
} 