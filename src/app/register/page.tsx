import React, { useState } from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';

const RegisterPage = () => {
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleRegister = async (data) => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            setSuccess('Registration successful! Please log in.');
            setError(null);
        } else {
            const errorData = await response.json();
            setError(errorData.message || 'Registration failed. Please try again.');
            setSuccess(null);
        }
    };

    return (
        <div>
            <h1>Register</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
            <RegisterForm onSubmit={handleRegister} />
        </div>
    );
};

export default RegisterPage;