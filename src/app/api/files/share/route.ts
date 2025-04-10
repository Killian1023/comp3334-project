import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fileAccess, files, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    // 2. 解析請求體
    const body = await request.json();
    const { fileId, ownerId, sharedWithUserId, encryptedFileKey } = body;

    if (!fileId || !sharedWithUserId || !encryptedFileKey) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // 3. 檢查文件是否存在並且屬於當前用戶
    const [fileRecord] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!fileRecord) {
      return NextResponse.json({ error: '找不到文件' }, { status: 400 });
    }

    if (fileRecord.userId !== ownerId) {
      return NextResponse.json({ error: '您無權共享此文件' }, { status: 403 });
    }

    // 4. 獲取被共享用戶的信息
    const [sharedWithUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, sharedWithUserId))
      .limit(1);

    if (!sharedWithUser) {
      return NextResponse.json({ error: '找不到接收共享的用戶' }, { status: 400 });
    }

    // 5. 檢查文件是否已經和此用戶共享
    const existingAccess = await db
      .select()
      .from(fileAccess)
      .where(
        and(
          eq(fileAccess.fileId, fileId),
          eq(fileAccess.sharedWith, sharedWithUser.id)
        )
      );

    if (existingAccess.length > 0) {
      return NextResponse.json({ error: '文件已與此用戶共享' }, { status: 400 });
    }

    // 6. 創建新的文件訪問記錄
    const newFileAccess = {
      id: nanoid(),
      fileId: fileId,
      sharedWith: sharedWithUser.id,
      ownerId: ownerId,
      encryptedFileKey: encryptedFileKey,
    };

    // 7. 將記錄插入數據庫
    await db.insert(fileAccess).values(newFileAccess);

    // 8. 返回成功響應
    return NextResponse.json({
      message: '文件共享成功',
      accessId: newFileAccess.id,
    }, { status: 200 });

  } catch (error) {
    console.error('共享文件時出錯:', error);
    return NextResponse.json({ error: '處理請求時出錯' }, { status: 500 });
  }
}