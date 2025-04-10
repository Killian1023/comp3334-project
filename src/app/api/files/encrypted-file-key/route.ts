import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getEncryptedFileKey, isAuthorizedForFile } from '@/lib/file';
import { logAction, logError } from '@/lib/logger';

export async function GET(
  request: Request,
) {
  try {
    // 驗證身份
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
        );
    }
    
    const token = authHeader.substring(7);
    const userId = await verifyToken(token);
    if (!userId) {
        return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
        );
    }

    // 從URL查詢參數中獲取fileId
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: '缺少必要的fileId參數' },
        { status: 400 }
      );
    }

    // 檢查用戶是否有權訪問該文件
    const isAuthorized = await isAuthorizedForFile(fileId, userId);
    if (!isAuthorized) {
      await logAction(`未授權的文件密鑰訪問嘗試: ${fileId}`, { userId: userId });
      return NextResponse.json(
        { error: '您無權訪問此文件' },
        { status: 403 }
      );
    }

    // 獲取加密文件的密鑰
    const encryptedFileKey = await getEncryptedFileKey(fileId);
    
    await logAction(`文件密鑰已獲取: ${fileId}`, { userId: userId });

    return NextResponse.json({ encryptedFileKey });
  } catch (error) {
    await logError(error as Error, 'getEncryptedFileKey API');
    return NextResponse.json(
      { error: '獲取文件密鑰時發生錯誤' },
      { status: 500 }
    );
  }
}