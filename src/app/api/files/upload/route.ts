import { NextResponse } from 'next/server';
import { encryptFile } from '@/lib/encryption';
import { logger } from '@/lib/logger';
import { validateFileUpload } from '@/lib/validation';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'No file uploaded or invalid file type.' }, { status: 400 });
    }

    const validationError = validateFileUpload(file);
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const encryptedData = await encryptFile(new Uint8Array(fileBuffer));

    const filePath = path.join(process.cwd(), 'uploads', file.name);
    fs.writeFileSync(filePath, encryptedData);

    logger.log('File uploaded and encrypted successfully', { fileName: file.name });

    return NextResponse.json({ message: 'File uploaded successfully.' }, { status: 200 });
}