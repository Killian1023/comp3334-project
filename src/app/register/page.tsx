'use client';

import React, { useState, useEffect } from 'react';
import RegisterForm from '@/app/components/auth/RegisterForm';
import { useRouter } from 'next/navigation';
import { generateKeyPairECC, KeyPair } from '@/app/utils/clientencryption';

type RegisterData = {
  username: string;
  password: string;
  email: string;
};

const RegisterPage = () => {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState<boolean>(false);
    const router = useRouter();

    const handleRegister = async (data: RegisterData): Promise<boolean> => {
        try {
            setIsLoading(true);
            console.log(`Registration attempt for user: ${data.username}`);
            
            // 在客户端生成密钥对
            const keyPair = await generateKeyPairECC();
            setPrivateKey(keyPair.privateKey);
            setPublicKey(keyPair.publicKey);
            
            // 发送请求到服务器，包含用户信息和公钥
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    publicKey: keyPair.publicKey // 将公钥发送给服务器
                }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errorMessage = responseData.error || responseData.message || 'Registration failed. Please try again.';
                setError(errorMessage);
                setSuccess(null);
                console.error(`Registration failed for ${data.username}:`, responseData);
                setIsLoading(false);
                return false;
            }
            
            setSuccess('Registration successful! Please save your private key securely.');
            setShowPrivateKey(true);
            
            // Store auth token and user info in localStorage
            localStorage.setItem('authToken', responseData.token);
            localStorage.setItem('user', JSON.stringify({
                id: responseData.userId,
                username: responseData.username,
                publicKey: keyPair.publicKey
            }));
            
            // Store private key securely
            localStorage.setItem('privateKey', keyPair.privateKey);
            
            return true;
            
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(`Registration failed: ${errorMessage}`);
            console.error('Client-side registration error:', err);
            setIsLoading(false);
            return false;
        }
    };

    const handleContinue = () => {
        router.push('/files');
    };

    const handleCopyPrivateKey = async () => {
        if (privateKey) {
            try {
                await navigator.clipboard.writeText(privateKey);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } catch (err) {
                console.error('Failed to copy private key:', err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
                    Create your account
                </h1>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}
                    
                    {success && !showPrivateKey && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                            {success}
                        </div>
                    )}

                    {showPrivateKey && privateKey && (
                        <div className="mb-6">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-yellow-800 mb-2">
                                    Important: Save Your Private Key
                                </h3>
                                <p className="text-yellow-700 mb-4">
                                    This is your private key. Please save it securely. You will need it to access your encrypted files.
                                </p>
                                <div className="relative">
                                    <div className="bg-gray-100 p-4 rounded font-mono text-sm break-all pr-12">
                                        {privateKey}
                                    </div>
                                    <div className="absolute top-2 right-2 flex items-center space-x-2">
                                        {copySuccess && (
                                            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                                Copied!
                                            </div>
                                        )}
                                        <button
                                            onClick={handleCopyPrivateKey}
                                            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                            title="Copy to clipboard"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={handleContinue}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Continue to Files
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {!showPrivateKey && (
                        <>
                            <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
                            
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
                                        Already have an account?{' '}
                                        <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                                            Sign in here
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;