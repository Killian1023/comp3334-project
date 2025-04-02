'use client';

import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface PasswordResetFormProps {
    onResetRequest: (email: string) => Promise<void>;
    onResetPassword?: (newPassword: string) => Promise<void>;
    showPasswordForm?: boolean;
    isLoading?: boolean;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ 
    onResetRequest, 
    onResetPassword, 
    showPasswordForm = false,
    isLoading = false
}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!email) {
            setError('Email is required');
            return;
        }
        
        try {
            await onResetRequest(email);
        } catch (err) {
            setError('Failed to process request');
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!password || !confirmPassword) {
            setError('Both fields are required');
            return;
        }
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }
        
        try {
            await onResetPassword?.(password);
        } catch (err) {
            setError('Failed to update password');
        }
    };

    if (showPasswordForm) {
        return (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {error && <p className="text-red-500">{error}</p>}
                
                <div>
                    <label htmlFor="password" className="block mb-1">New Password</label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Enter new password"
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
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Reset Password'}
                </Button>
            </form>
        );
    }

    return (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}
            
            <div>
                <label htmlFor="email" className="block mb-1">Email</label>
                <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            
            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
        </form>
    );
};

export default PasswordResetForm;