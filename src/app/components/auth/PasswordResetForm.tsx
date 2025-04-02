import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Form } from '../ui/Form';

const PasswordResetForm = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (response.ok) {
            setMessage('Password reset link sent to your email.');
            setEmail('');
        } else {
            setMessage('Error sending password reset link. Please try again.');
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            <h2>Reset Password</h2>
            {message && <p>{message}</p>}
            <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <Button type="submit">Send Reset Link</Button>
        </Form>
    );
};

export default PasswordResetForm;