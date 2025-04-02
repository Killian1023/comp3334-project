import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { sendPasswordResetEmail } from '@/lib/auth';
import { validateEmail } from '@/lib/validation';
import { logAction } from '@/lib/logger';

export async function POST(request: Request) {
    const { email } = await request.json();

    if (!validateEmail(email)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resetToken = await db.createPasswordResetToken(user.id);
    await sendPasswordResetEmail(email, resetToken);

    logAction(`Password reset email sent to ${email}`);

    return NextResponse.json({ message: 'Password reset email sent' }, { status: 200 });
}