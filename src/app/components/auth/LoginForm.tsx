import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Changed from next/router to next/navigation
import Input from '../ui/Input';
import Button from '../ui/Button';

interface LoginFormProps {
  onLogin?: (credentials: { username: string; password: string }) => Promise<void>;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const [username, setUsername] = useState(''); // Changed from email to username to match API
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const credentials = { username, password };
        
        try {
            if (onLogin) {
                // Use the onLogin prop if provided
                await onLogin(credentials);
            } else {
                // Otherwise handle login directly
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(credentials),
                });

                if (response.ok) {
                    router.push('/dashboard');
                } else {
                    const data = await response.json();
                    setError(data.message || 'Login failed');
                }
            }
        } catch (error) {
            setError('An error occurred during login');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Login</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <Input
                label="Username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <Input
                label="Password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <Button type="submit" onClick={() => {}}>Login</Button>
        </form>
    );
};

export default LoginForm;