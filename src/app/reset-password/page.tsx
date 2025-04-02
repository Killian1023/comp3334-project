import React, { useState } from 'react';
import PasswordResetForm from '@/components/auth/PasswordResetForm';

const ResetPasswordPage = () => {
    const [message, setMessage] = useState('');

    const handleReset = async (email) => {
        // Call the API to reset the password
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (response.ok) {
            setMessage('Password reset link has been sent to your email.');
        } else {
            setMessage('Failed to send password reset link. Please try again.');
        }
    };

    return (
        <div>
            <h1>Reset Password</h1>
            {message && <p>{message}</p>}
            <PasswordResetForm onReset={handleReset} />
        </div>
    );
};

export default ResetPasswordPage;