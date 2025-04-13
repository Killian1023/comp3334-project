'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/app/components/auth/LoginForm';
import { extractPublicKeyFromPrivate, generateHOTP } from '@/app/utils/hotp';
import { signAction } from '../utils/clientencryption';

const LoginPage = () => {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (credentials: {username: string; password: string; privateKey: string}) => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Validate private key format - simple check to see if it parses as JSON
            let privateKeyValid = false;
            let publicKey = null;
            
            try {
                const parsed = JSON.parse(atob(credentials.privateKey));
                // Simple validation that it has the expected structure
                if (parsed.kty && parsed.crv && parsed.d) {
                    privateKeyValid = true;
                    publicKey = extractPublicKeyFromPrivate(credentials.privateKey);
                }
            } catch (e) {
                setError('Invalid private key format. Please check and try again.');
                setIsLoading(false);
                return;
            }
            
            if (!privateKeyValid || !publicKey) {
                setError('The private key appears to be in the wrong format.');
                setIsLoading(false);
                return;
            }

            const actionSignature = await signAction('login', credentials.privateKey);
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    usernameOrEmail: credentials.username,
                    password: credentials.password,
                    publicKey: publicKey,
                    actionSignature: actionSignature
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                setError(data.message || 'Login failed');
                setIsLoading(false);
                return;
            }
            
            // Get counter for HOTP generation
            const counterResponse = await fetch('/api/auth/getCounter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: data.user.id
                }),
            });
            
            const counterData = await counterResponse.json();
            const counter = counterData.counter;
            
            // Generate HOTP code with the private key and counter
            const hotpCode = await generateHOTP(credentials.privateKey, counter);
            
            // Directly verify HOTP instead of showing input form
            try {
                const verifyResponse = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: data.user.id,
                        hotpCode: hotpCode,
                        counter: counter
                    }),
                });

                const verifyData = await verifyResponse.json();
                
                if (!verifyResponse.ok) {
                    setError(verifyData.message || 'Verification failed');
                    setIsLoading(false);
                    return;
                }
                
                // Store auth token
                localStorage.setItem('authToken', verifyData.token);
                
                // Store private key
                localStorage.setItem('privateKey', credentials.privateKey);
                
                // Store user info
                localStorage.setItem('user', JSON.stringify(verifyData.user));
                
                // Log successful login
                console.log('Login successful with automatic HOTP verification');
                
                // Redirect to files page
                router.push('/files');
                
            } catch (error) {
                console.error('HOTP verification error:', error);
                setError('An error occurred during verification. Please try again.');
                setIsLoading(false);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            setError('An unexpected error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
                    Sign in to your account
                </h1>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}
                    
                    <LoginForm onLogin={handleLogin} isLoading={isLoading} />
                    
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Or
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <a href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                                    Register here
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;