'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/app/components/auth/LoginForm';

const LoginPage = () => {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (credentials: {username: string; password: string}) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    usernameOrEmail: credentials.username,
                    password: credentials.password
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                setError(data.message || 'Login failed');
                return;
            }
            
            // Store auth token
            localStorage.setItem('authToken', data.token);
            
            // Store user info (without sensitive data)
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Generate and store encryption keys if they don't exist yet
            await ensureEncryptionKeys(data.user.id);
            
            // Log successful login
            console.log('Login successful');
            
            // Redirect to files page instead of dashboard
            router.push('/files');
        } catch (error) {
            console.error('Login error:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Ensure encryption keys are generated and stored for the user
    const ensureEncryptionKeys = async (userId: string) => {
        try {
            // Check if keys already exist
            if (!localStorage.getItem(`encryptionKey_${userId}`)) {
                // Generate a new encryption key
                const key = await window.crypto.subtle.generateKey(
                    {
                        name: 'AES-GCM',
                        length: 256
                    },
                    true,
                    ['encrypt', 'decrypt']
                );
                
                // Export the key to store it
                const exportedKey = await window.crypto.subtle.exportKey('raw', key);
                const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
                console.log('Generated encryption key:', keyBase64);
                // Store the key with user ID to keep it specific to the user
                localStorage.setItem(`encryptionKey_${userId}`, keyBase64);
            }
        } catch (error) {
            console.error('Failed to generate encryption keys:', error);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold mb-6">Login to Your Account</h1>
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p>{error}</p>
                </div>
            )}
            <LoginForm onLogin={handleLogin} />
            <div className="mt-4 text-center">
                <p>Don't have an account? <a href="/register" className="text-blue-500 hover:underline">Register here</a></p>
            </div>
        </div>
    );
};

export default LoginPage;