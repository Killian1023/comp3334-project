import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { decryptFile } from '@/lib/encryption';
import { logger } from '@/lib/logger';
import { getFileById } from '@/db/index';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const session = await getSession(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileId = params.id;
    const file = await getFileById(fileId);

    if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    try {
        const decryptedFile = await decryptFile(file.encryptedData);
        logger.log('File downloaded', { userId: session.userId, fileId });
        return new Response(decryptedFile, {
            headers: {
                'Content-Type': file.contentType,
                'Content-Disposition': `attachment; filename="${file.originalName}"`,
            },
        });
    } catch (error) {
        logger.error('Error decrypting file', { error });
        return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }
}