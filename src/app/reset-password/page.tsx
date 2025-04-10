'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordResetForm from '@/app/components/auth/PasswordResetForm';
import Link from 'next/link';

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
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
                <div className="flex items-center space-x-4">
                    <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800">
                        Back to Login
                    </Link>
                </div>
            </div>
            
            {status === 'success' && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm">{message}</p>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2">
                    <PasswordResetForm 
                        onResetRequest={handleResetRequest}
                        onResetPassword={handleResetPassword}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;