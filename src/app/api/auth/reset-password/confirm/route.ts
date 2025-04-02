import { NextResponse } from 'next/server';
import { resetPassword } from '../../../../../lib/auth';
import { logAction, logError } from '../../../../../lib/logger';

export async function POST(request: Request) {
    try {
        await logAction('Password reset confirmation request received');
        
        const { token, newPassword } = await request.json();

        if (!token || !newPassword) {
            await logAction('Password reset confirmation failed', { reason: 'Missing parameters' });
            return NextResponse.json({ 
                error: 'Token and new password are required' 
            }, { status: 400 });
        }

        if (newPassword.length < 8) {
            await logAction('Password reset confirmation failed', { reason: 'Password too short' });
            return NextResponse.json({ 
                error: 'Password must be at least 8 characters' 
            }, { status: 400 });
        }

        // Attempt to reset the password using the token
        const success = await resetPassword(token, newPassword);
        
        if (success) {
            await logAction('Password reset successful', { tokenPrefix: token.substring(0, 8) });
            return NextResponse.json({ message: 'Password has been reset successfully' });
        } else {
            await logAction('Password reset failed - invalid or expired token', { tokenPrefix: token.substring(0, 8) });
            return NextResponse.json({ 
                error: 'Invalid or expired reset token' 
            }, { status: 400 });
        }
    } catch (error) {
        await logError(error as Error, 'password-reset-confirm');
        return NextResponse.json({ 
            error: 'An error occurred processing your request' 
        }, { status: 500 });
    }
}
