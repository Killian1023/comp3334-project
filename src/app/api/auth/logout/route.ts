import { NextResponse } from 'next/server';
import { getSession, destroySession } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getSession(req);

    if (!session) {
        return NextResponse.json({ message: 'No active session found.' }, { status: 401 });
    }

    // Invalidate the session
    await destroySession(session.userId);

    return NextResponse.json({ message: 'Logged out successfully.' }, { status: 200 });
}