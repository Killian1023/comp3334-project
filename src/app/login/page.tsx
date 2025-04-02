'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/app/components/auth/LoginForm';

const LoginPage = () => {
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (credentials: {username: string; password: string}) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message);
            } else {
                // Redirect to dashboard on successful login
                router.push('/dashboard');
            }
        } catch (error) {
            setError('An error occurred during login');
        }
    };

    return (
        <div>
            <h1>Login</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <LoginForm onLogin={handleLogin} />
        </div>
    );
};

export default LoginPage;