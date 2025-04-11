import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { deleteFile } from '@/lib/file';
import { logAction, logError } from '@/lib/logger';

export async function DELETE(request: NextRequest) {
  try {

    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const userId = verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the ID of the archive to be deleted
    const { fileId } = await request.json();
    if (!fileId) {
      return NextResponse.json({
        error: 'Missing file ID'
      }, { status: 400 });
    }

    // Delete files and related sharing permissions
    await deleteFile(fileId, userId);

    return NextResponse.json({
      success: true,
      message: 'The file has been successfully deleted'
    });
  } catch (error: any) {
    await logError(error, 'DELETE /api/files/delete');
    
    if (error.message === 'Unauthorized to delete this file') {
      return NextResponse.json({
        error: 'You do not have permission to delete this file'
      }, { status: 403 });
    } else if (error.message === 'File not found') {
      return NextResponse.json({
        error: 'File not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      error: 'An error occurred while deleting the file'
    }, { status: 500 });
  }
}