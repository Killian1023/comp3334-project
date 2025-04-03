'use client';

import React, { useState } from 'react';
import RegisterForm from '@/app/components/auth/RegisterForm';
import { useRouter } from 'next/navigation';
import { ensureEncryptionKeys } from '@/app/utils/clientencryption';

type RegisterData = {
  username: string;
  password: string;
};

const RegisterPage = () => {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const router = useRouter();

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
            
            // Generate and store encryption keys using the centralized function
            await ensureEncryptionKeys(registrationData.userId, data.password);
            
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