'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  metadata?: string;
  level: string;
}

const AdminPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError,] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check if user is admin
        const checkAdmin = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const response = await fetch('/api/admin/auth', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    // Redirect non-admin users
                    router.push('/');
                    return;
                }

                // Load admin data
                loadData();
            } catch (err) {
                console.error('Error checking admin status:', err);
                router.push('/login');
            }
        };

        checkAdmin();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersData, logsData] = await Promise.all([
                fetchUsers(),
                fetchLogs()
            ]);
            setUsers(usersData);
            setLogs(logsData);
        } catch (err) {
            console.error('Error loading admin data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async (): Promise<User[]> => {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        return data.users;
    };

    const fetchLogs = async (): Promise<LogEntry[]> => {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/admin/logs', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch logs');
        }

        const data = await response.json();
        return data.logs;
    };

    // Parse JSON metadata for display
    const parseMetadata = (metadataStr?: string) => {
        if (!metadataStr) return null;
        
        try {
            const metadata = JSON.parse(metadataStr);
            return metadata;
        } catch (err) {
            return metadataStr;
        }
    };

    if (loading) {
        return <div className="p-4">Loading admin dashboard...</div>;
    }

    if (error) {
        return (
            <div className="p-4 text-red-500">
                {error}
                <button 
                    onClick={loadData} 
                    className="ml-4 px-3 py-1 bg-blue-500 text-white rounded">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            
            <div className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">User Management</h2>
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                    <table className="min-w-full table-auto">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left">ID</th>
                                <th className="px-4 py-2 text-left">Username</th>
                                <th className="px-4 py-2 text-left">Email</th>
                                <th className="px-4 py-2 text-left">Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-t">
                                    <td className="px-4 py-2">{user.id.substring(0, 8)}...</td>
                                    <td className="px-4 py-2">{user.username}</td>
                                    <td className="px-4 py-2">{user.email}</td>
                                    <td className="px-4 py-2">
                                        {new Date(user.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-2 text-center">
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div>
                <h2 className="text-2xl font-semibold mb-4">Log Auditing</h2>
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                    <table className="min-w-full table-auto">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left">Timestamp</th>
                                <th className="px-4 py-2 text-left">Level</th>
                                <th className="px-4 py-2 text-left">Message</th>
                                <th className="px-4 py-2 text-left">Metadata</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} className={`border-t ${log.level === 'error' ? 'bg-red-50' : ''}`}>
                                    <td className="px-4 py-2">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className={`px-4 py-2 ${log.level === 'error' ? 'text-red-600' : ''}`}>
                                        {log.level.toUpperCase()}
                                    </td>
                                    <td className="px-4 py-2">{log.message}</td>
                                    <td className="px-4 py-2">
                                        {log.metadata && (
                                            <details>
                                                <summary>View details</summary>
                                                <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
                                                    {JSON.stringify(parseMetadata(log.metadata), null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-2 text-center">
                                        No logs found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;