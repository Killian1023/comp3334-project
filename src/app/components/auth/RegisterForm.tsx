import React, { useState } from 'react';
import { useRouter } from 'next/router';
import  Input  from '../ui/Input';
import  Button  from '../ui/Button';
import { validateEmail } from '../../utils/validators'; // Assuming you have a validation utility

const RegisterForm = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!username || !email || !password) {
            setError('All fields are required.');
            return;
        }

        if (!validateEmail(email)) {
            setError('Invalid email format.');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || 'Registration failed.');
                return;
            }

            setSuccess('Registration successful! Redirecting...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Register</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
            <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit">Register</Button>
        </form>
    );
};

export default RegisterForm;