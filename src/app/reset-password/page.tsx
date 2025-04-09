'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordResetForm from '@/app/components/auth/PasswordResetForm';

const ResetPasswordPage = () => {
    const [message, setMessage] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const router = useRouter();

    // Handle initial reset request
    const handleResetRequest = async (usernameOrEmail: string): Promise<void> => {
        setIsLoading(true);
        setMessage('');
        // The actual API call is now handled directly in the form component
        // This is just a placeholder for compatibility
        setIsLoading(false);
    };

    // Handle password reset with HOTP verification
    const handleResetPassword = async (newPassword: string, hotpCode: string): Promise<void> => {
        setIsLoading(true);
        setMessage('');
        
        // The actual verification is already handled in the form component
        setMessage('Your password has been reset successfully!');
        setStatus('success');
        
        // Redirect to login page after successful reset
        setTimeout(() => {
            router.push('/login');
        }, 2000);
        
        setIsLoading(false);
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
                isLoading={isLoading}
            />
        </div>
    );
};

export default ResetPasswordPage;