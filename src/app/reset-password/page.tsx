'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PasswordResetForm from '@/app/components/auth/PasswordResetForm';
import { logAction } from '@/lib/logger';

const ResetPasswordPage = () => {
    const [message, setMessage] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    // Handle email submission for reset link
    const handleResetRequest = async (email: string): Promise<void> => {
        try {
            setIsLoading(true);
            setMessage('');

            // Call the API to request a password reset
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Password reset link has been sent to your email.');
                setStatus('success');
                console.log('Password reset requested for:', email);
            } else {
                setMessage(data.error || 'Failed to send password reset link. Please try again.');
                setStatus('error');
            }
        } catch (error) {
            console.error('Error requesting password reset:', error);
            setMessage('An error occurred. Please try again later.');
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle password reset with token
    const handleResetPassword = async (newPassword: string): Promise<void> => {
        try {
            setIsLoading(true);
            setMessage('');

            // Call the API to reset the password using the token
            const response = await fetch('/api/auth/reset-password/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Your password has been reset successfully!');
                setStatus('success');
                
                // Redirect to login page after successful reset
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                setMessage(data.error || 'Failed to reset password. The link may be invalid or expired.');
                setStatus('error');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setMessage('An error occurred. Please try again later.');
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-md">
            <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
            
            {status === 'success' && (
                <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4 text-green-700">
                    {message}
                </div>
            )}
            
            {status === 'error' && (
                <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4 text-red-700">
                    {message}
                </div>
            )}
            
            <PasswordResetForm 
                onResetRequest={handleResetRequest}
                onResetPassword={handleResetPassword}
                showPasswordForm={!!token}
                isLoading={isLoading}
            />
        </div>
    );
};

export default ResetPasswordPage;