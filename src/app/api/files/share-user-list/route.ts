import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getShareList, getAllUsers } from '@/lib/file';

export async function GET(request: NextRequest) {
  try {
    // 獲取文件ID參數
    const fileId = request.nextUrl.searchParams.get('fileId');
    if (!fileId) {
      return NextResponse.json(
        { message: 'File ID is required' },
        { status: 400 }
      );
    }
    
    // 获取查询类型参数
    const type = request.nextUrl.searchParams.get('type') || 'shared';
    
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
    
    // 根据type参数获取不同的用户列表
    let users;
    if (type === 'all') {
      // 获取所有可分享的用户列表（排除当前用户和已分享的用户）
      users = await getAllUsers(fileId, userId);
    } else {
      // 获取已分享的用户列表
      users = await getShareList(fileId);
    }
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in share-list API:', error);
    return NextResponse.json(
      { message: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}