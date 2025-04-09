import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface LoginFormProps {
  onLogin?: (credentials: { username: string; password: string; privateKey: string }) => Promise<void>;
  isLoading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading: externalLoading = false }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    
    // Combined loading state from both internal and external sources
    const isLoading = loading || externalLoading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        // Basic client-side validation
        if (!username) {
            setError('Username is required');
            setLoading(false);
            return;
        }
        
        if (!password) {
            setError('Password is required');
            setLoading(false);
            return;
        }
        
        if (!privateKey) {
            setError('Private key is required');
            setLoading(false);
            return;
        }
        
        const credentials = { username, password, privateKey };
        
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
                    
                    // Store the token and private key in localStorage
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('privateKey', privateKey);
                    
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
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username or Email
                </label>
                <div className="mt-1">
                    <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username or email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>
            
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                </label>
                <div className="mt-1">
                    <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>
            
            <div>
                <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700">
                    Private Key
                </label>
                <div className="mt-1">
                    <textarea
                        id="privateKey"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                        placeholder="Enter your private key"
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        rows={3}
                        disabled={isLoading}
                        required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        This was provided to you during registration. You need it to access your encrypted files.
                    </p>
                </div>
            </div>
            
            <div>
                <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
            </div>
        </form>
    );
};

export default LoginForm;