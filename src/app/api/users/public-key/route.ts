import { getUserPublicKeyById } from '@/lib/auth';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // 獲取目標用戶ID
    const targetUserId = request.nextUrl.searchParams.get('userId');
    if (!targetUserId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // 獲取用戶公鑰
    const publicKey = await getUserPublicKeyById(targetUserId);
    
    if (!publicKey) {
      return NextResponse.json(
        { message: 'Public key not found for the specified user' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ publicKey });
  } catch (error) {
    console.error('Error fetching public key:', error);
    return NextResponse.json(
      { message: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}