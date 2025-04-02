import { NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/auth';
import { logUserAction } from '@/lib/logger';

export async function POST(request: Request) {
    const { username, password } = await request.json();

    try {
        const user = await verifyCredentials(username, password);
        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Here you would typically create a session token
        const sessionToken = createSessionToken(user.id); // Implement this function

        logUserAction(user.id, 'login');

        return NextResponse.json({ token: sessionToken });
    } catch (error) {
        return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
    }
}