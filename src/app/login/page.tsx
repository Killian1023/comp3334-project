'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/app/components/auth/LoginForm';
import { ensureEncryptionKeys } from '@/app/utils/clientencryption';
import { extractPublicKeyFromPrivate, generateHOTP } from '@/app/utils/hotp';

const LoginPage = () => {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showHotpInput, setShowHotpInput] = useState(false);
    const [hotpCode, setHotpCode] = useState('');
    const [tempUserData, setTempUserData] = useState<any>(null);
    const [counter, setCounter] = useState(0);
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
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    usernameOrEmail: credentials.username,
                    password: credentials.password,
                    publicKey: publicKey 
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                setError(data.message || 'Login failed');
                setIsLoading(false);
                return;
            }
            
            // Store credentials temporarily for HOTP verification
            setTempUserData({
                userData: data,
                privateKey: credentials.privateKey,
                password: credentials.password
            });
            
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
            const newCounter = counterData.counter;
            setCounter(newCounter);
            
            // Generate HOTP code with the private key and counter
            const generatedHotp = await generateHOTP(credentials.privateKey, newCounter);
            
            // Show HOTP input field
            setShowHotpInput(true);
            // Auto-fill the generated HOTP (in a real app, you might want user to enter it)
            setHotpCode(generatedHotp);
            setIsLoading(false);
            
        } catch (error) {
            console.error('Login error:', error);
            setError('An unexpected error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    const verifyHotp = async () => {
        if (!tempUserData || !hotpCode) return;
        
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: tempUserData.userData.user.id,
                    hotpCode: hotpCode,
                    counter: counter
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                setError(data.message || 'Verification failed');
                setIsLoading(false);
                return;
            }
            
            // Store auth token
            localStorage.setItem('authToken', data.token);
            
            // Store private key
            localStorage.setItem('privateKey', tempUserData.privateKey);
            
            // Store user info
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Generate and store encryption keys
            await ensureEncryptionKeys(data.user.id, tempUserData.password);
            
            // Log successful login
            console.log('Login successful with HOTP verification');
            
            // Redirect to files page
            router.push('/files');
            
        } catch (error) {
            console.error('HOTP verification error:', error);
            setError('An error occurred during verification. Please try again.');
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
                    
                    {!showHotpInput ? (
                        <LoginForm onLogin={handleLogin} isLoading={isLoading} />
                    ) : (
                        <div>
                            <div className="mb-4">
                                <label htmlFor="hotp" className="block text-sm font-medium text-gray-700">
                                    Authentication Code
                                </label>
                                <input
                                    id="hotp"
                                    name="hotp"
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={hotpCode}
                                    onChange={(e) => setHotpCode(e.target.value)}
                                    maxLength={6}
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                    Enter the 6-digit code generated for your account
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={verifyHotp}
                                disabled={isLoading || hotpCode.length !== 6}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                            >
                                {isLoading ? 'Verifying...' : 'Verify Code'}
                            </button>
                        </div>
                    )}
                    
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