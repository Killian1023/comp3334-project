'use client';

import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { generateHOTP } from '@/app/utils/hotp';

interface PasswordResetFormProps {
    onResetRequest?: (usernameOrEmail: string) => Promise<void>;
    onResetPassword?: (newPassword: string, hotpCode: string) => Promise<void>;
    showPasswordForm?: boolean;
    isLoading?: boolean;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ 
    onResetRequest, 
    onResetPassword, 
    showPasswordForm = false,
    isLoading = false
}) => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [hotpCode, setHotpCode] = useState('');
    const [showHotpInput, setShowHotpInput] = useState(false);
    const [counter, setCounter] = useState(0);
    const [userId, setUserId] = useState('');

    const handleUsernameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!usernameOrEmail) {
            setError('Username or email is required');
            return;
        }
        
        if (!privateKey) {
            setError('Private key is required');
            return;
        }
        
        try {
            // First validate the private key format
            try {
                const parsed = JSON.parse(atob(privateKey));
                if (!parsed.kty || !parsed.crv || !parsed.d) {
                    setError('Invalid private key format.');
                    return;
                }
            } catch (e) {
                setError('Invalid private key format. Please check and try again.');
                return;
            }
            
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernameOrEmail })
            });
            
            const data = await response.json();
            
            if (response.ok && data.userId) {
                // Generate HOTP code with the private key and counter
                setUserId(data.userId);
                setCounter(data.counter);
                const generatedHotp = await generateHOTP(privateKey, data.counter);
                setHotpCode(generatedHotp);
                setShowHotpInput(true);
            } else {
                setError(data.error || 'Failed to process request');
            }
        } catch (err) {
            setError('Failed to process request');
            console.error(err);
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
            const response = await fetch('/api/auth/reset-password/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    hotpCode,
                    counter,
                    newPassword: password
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                setError(data.error || 'Failed to reset password');
                return;
            }
            
            if (onResetPassword) {
                await onResetPassword(password, hotpCode);
            }
        } catch (err) {
            setError('Failed to update password');
            console.error(err);
        }
    };

    if (showPasswordForm || showHotpInput) {
        return (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {error && <p className="text-red-500">{error}</p>}
                
                <div>
                    <label htmlFor="hotpCode" className="block mb-1">Authentication Code</label>
                    <Input
                        id="hotpCode"
                        type="text"
                        placeholder="6-digit code"
                        value={hotpCode}
                        onChange={(e) => setHotpCode(e.target.value)}
                        disabled={isLoading}
                        maxLength={6}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Enter the 6-digit code generated from your private key
                    </p>
                </div>
                
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
        <form onSubmit={handleUsernameSubmit} className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}
            
            <div>
                <label htmlFor="usernameOrEmail" className="block mb-1">Username or Email</label>
                <Input
                    id="usernameOrEmail"
                    type="text"
                    placeholder="Enter your username or email"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            
            <div>
                <label htmlFor="privateKey" className="block mb-1">Private Key</label>
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
                    This was provided to you during registration. You need it to reset your password.
                </p>
            </div>
            
            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Continue'}
            </Button>
        </form>
    );
};

export default PasswordResetForm;