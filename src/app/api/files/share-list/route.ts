import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getShareList } from '@/lib/file';

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
    
    // 驗證身份
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // 獲取分享清單
    const users = await getShareList(fileId);
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in share-list API:', error);
    return NextResponse.json(
      { message: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}