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
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
                    Reset Password
                </h1>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {status === 'success' && (
                        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
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
                    
                    <PasswordResetForm 
                        onResetRequest={handleResetRequest}
                        onResetPassword={handleResetPassword}
                        isLoading={isLoading}
                    />
                    
                    <div className="mt-6 text-center">
                        <Link href="/files" className="text-sm text-blue-600 hover:text-blue-800">
                            Back to Homepage
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;