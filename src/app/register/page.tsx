'use client';

import React, { useState } from 'react';
import RegisterForm from '@/app/components/auth/RegisterForm';
import { useRouter } from 'next/navigation';

type RegisterData = {
  username: string;
  password: string;
};

const RegisterPage = () => {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const router = useRouter();

    // Ensure encryption keys are generated and stored for the user - same as in login page
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
                console.log('Generated encryption key during registration:', keyBase64);
                // Store the key with user ID to keep it specific to the user
                localStorage.setItem(`encryptionKey_${userId}`, keyBase64);
            }
        } catch (error) {
            console.error('Failed to generate encryption keys:', error);
        }
    };

    const handleRegister = async (data: RegisterData): Promise<boolean> => {
        try {
            setIsLoading(true);
            console.log(`Registration attempt for user: ${data.username}`);
            
            // Step 1: Register the user
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Registration failed. Please try again.');
                setSuccess(null);
                console.error(`Registration failed for ${data.username}: ${errorData.message}`);
                setIsLoading(false);
                return false;
            }
            
            // Get registration response which now includes the token
            const registrationData = await response.json();
            setSuccess('Registration successful! Logging you in...');
            
            // Store auth token and user info in localStorage directly from registration response
            localStorage.setItem('authToken', registrationData.token);
            localStorage.setItem('user', JSON.stringify({
                id: registrationData.userId,
                username: registrationData.username
            }));
            
            // Generate and store encryption keys for the new user
            await ensureEncryptionKeys(registrationData.userId);
            
            // Log success
            console.log('User registered and logged in successfully');
            
            // Redirect to the files page
            setTimeout(() => {
                router.push('/files');
            }, 500);
            
            return true;
            
        } catch (err) {
            setError('An error occurred during registration. Please try again.');
            console.error('Client-side registration error:', err);
            setIsLoading(false);
            return false;
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {success && <p className="text-green-500 mb-4">{success}</p>}
            <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
        </div>
    );
};

export default RegisterPage;