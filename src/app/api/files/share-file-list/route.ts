import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSharedFilesForUser } from '@/lib/file';
import { logAction, logError } from '@/lib/logger';

/**
 * 獲取已分享給當前用戶的檔案列表
 * 
 * 身份驗證:
 * - 需要 Bearer token 用於身份驗證
 * 
 * 返回已分享給當前用戶的所有檔案清單
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 驗證用戶身份
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const userId = verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: '無效的認證令牌' }, { status: 401 });
    }

    // 2. 獲取分享給當前用戶的檔案列表
    const sharedFiles = await getSharedFilesForUser(userId);

    // 3. 記錄操作並返回檔案列表
    await logAction('獲取分享檔案列表成功', { userId, fileCount: sharedFiles.length });
    return NextResponse.json({ files: sharedFiles });
    
  } catch (error) {
    await logError(error as Error, 'shared-files-list API');
    return NextResponse.json({ error: '獲取分享檔案列表失敗' }, { status: 500 });
  }
}