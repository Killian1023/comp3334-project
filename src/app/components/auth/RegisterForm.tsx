'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../ui/Input';
import Button from '../ui/Button';

// Define type for the onSubmit prop
interface RegisterFormProps {
  onSubmit: (data: { username: string; password: string }) => Promise<boolean>;
  isLoading?: boolean; // Add prop for external loading state
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading: externalLoading = false }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Combined loading state from both internal and external sources
    const isLoading = loading || externalLoading;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Perform validation
        if (!username || !password || !confirmPassword) {
            setError('All fields are required.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            setLoading(false);
            return;
        }

        try {
            // Use the onSubmit prop provided by the parent component
            await onSubmit({ username, password });
            // Don't need to handle success here anymore as the parent will redirect
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Form submission error:', err);
        }
        
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}
            
            <div>
                <label htmlFor="username" className="block mb-1">Username</label>
                <Input
                    id="username"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            
            <div>
                <label htmlFor="password" className="block mb-1">Password</label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            
            <div>
                <label htmlFor="confirmPassword" className="block mb-1">Confirm Password</label>
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            
            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Register'}
            </Button>
        </form>
    );
};

export default RegisterForm;