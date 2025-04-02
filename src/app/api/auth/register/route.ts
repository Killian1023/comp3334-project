import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { createUser } from '@/db/index';
import { validateRegistration } from '@/lib/validation';
import { logAction } from '@/lib/logger';

export async function POST(request: Request) {
    const body = await request.json();
    const { username, password } = body;

    // Validate user input
    const validationError = validateRegistration(username, password);
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user in the database
    try {
        const user = await createUser(username, hashedPassword);
        logAction('User registered', { username: user.username });
        return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'User registration failed' }, { status: 500 });
    }
}