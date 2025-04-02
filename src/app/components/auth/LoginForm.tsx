import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface LoginFormProps {
  onLogin?: (credentials: { username: string; password: string }) => Promise<void>;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        // Basic client-side validation
        if (!username) {
            setError('Username is required');
            setIsLoading(false);
            return;
        }
        
        if (!password) {
            setError('Password is required');
            setIsLoading(false);
            return;
        }
        
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
                    body: JSON.stringify({ usernameOrEmail: username, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // Store the token in localStorage or secure cookie
                    localStorage.setItem('token', data.token);
                    
                    // Redirect to dashboard
                    router.push('/dashboard');
                } else {
                    const data = await response.json();
                    setError(data.message || 'Login failed');
                }
            }
        } catch (error) {
            setError('An error occurred during login');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold">Login</h2>
            {error && <p className="text-red-500">{error}</p>}
            <Input
                label="Username or Email"
                type="text"
                placeholder="Enter your username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <Button 
                type="submit" 
                disabled={isLoading}
                onClick={() => {}}
            >
                {isLoading ? 'Logging in...' : 'Login'}
            </Button>
        </form>
    );
};

export default LoginForm;