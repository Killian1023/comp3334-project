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
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div>
                    <label htmlFor="hotpCode" className="block text-sm font-medium text-gray-700">
                        Authentication Code
                    </label>
                    <div className="mt-1">
                        <Input
                            id="hotpCode"
                            type="text"
                            placeholder="6-digit code"
                            value={hotpCode}
                            onChange={(e) => setHotpCode(e.target.value)}
                            disabled={isLoading}
                            maxLength={6}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Enter the 6-digit code generated from your private key
                    </p>
                </div>
                
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        New Password
                    </label>
                    <div className="mt-1">
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm Password
                    </label>
                    <div className="mt-1">
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                
                <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {isLoading ? (
                        <div className="flex items-center">
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                        </div>
                    ) : 'Reset Password'}
                </Button>
            </form>
        );
    }

    return (
        <form onSubmit={handleUsernameSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}
            
            <div>
                <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-700">
                    Username or Email
                </label>
                <div className="mt-1">
                    <Input
                        id="usernameOrEmail"
                        type="text"
                        placeholder="Enter your username or email"
                        value={usernameOrEmail}
                        onChange={(e) => setUsernameOrEmail(e.target.value)}
                        disabled={isLoading}
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
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    This was provided to you during registration. You need it to reset your password.
                </p>
            </div>
            
            <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                {isLoading ? (
                    <div className="flex items-center">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                    </div>
                ) : 'Continue'}
            </Button>
        </form>
    );
};

export default PasswordResetForm;