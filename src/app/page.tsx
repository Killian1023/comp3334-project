import React from 'react';
import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="text-center py-10">
            <h1 className="text-3xl font-bold mb-4">Welcome to the User Management System</h1>
            <p className="mb-6">Please navigate to the login or registration page to get started.</p>
            <div className="flex gap-4 justify-center">
                <Link 
                    href="/login" 
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Login
                </Link>
                <Link 
                    href="/register" 
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                    Register
                </Link>
            </div>
        </div>
    );
}