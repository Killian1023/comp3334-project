import { NextResponse } from 'next/server';
import { getUserByEmail, requestPasswordReset } from '../../../../lib/auth';
import { validateEmail } from '../../../utils/validators';
import { logAction, logError } from '../../../../lib/logger';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        await logAction('Password reset request received');
        
        const { email } = await request.json();

        if (!email || !validateEmail(email)) {
            await logAction('Password reset validation failed', { reason: 'Invalid email' });
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        const user = await getUserByEmail(email);
        
        // For security reasons, don't reveal if the email exists
        if (!user) {
            await logAction('Password reset attempted for non-existent email', { email });
            // Return success anyway to prevent email enumeration
            return NextResponse.json({ 
                message: 'If your email is registered, you will receive a reset link shortly'
            });
        }

        // Generate a reset token and store it
        const resetToken = uuidv4();
        const success = await requestPasswordReset(email);
        
        if (success) {
            await logAction('Password reset link generated', { userId: user.id });
            
            // In a real application, you would send an email here with the reset link
            // For development, log the token
            console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`);
            
            return NextResponse.json({ 
                message: 'If your email is registered, you will receive a reset link shortly'
            });
        } else {
            throw new Error('Failed to generate reset token');
        }
    } catch (error) {
        await logError(error as Error, 'password-reset-request');
        return NextResponse.json({ 
            error: 'An error occurred processing your request' 
        }, { status: 500 });
    }
}