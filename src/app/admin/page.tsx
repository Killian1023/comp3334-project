'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  metadata?: string;
  level: string;
}

interface AdminInfo {
  isAdmin: boolean;
  username: string;
  adminId: string;
}

const AdminPage = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check if user is admin using the admins table
        const checkAdmin = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    router.push('/login?redirect=/admin');
                    return;
                }

                const response = await fetch('/api/admin/auth', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    console.error('Not authorized as admin');
                    router.push('/');
                    return;
                }

                const data = await response.json();
                setAdminInfo(data);
                
                // Load admin data
                loadLogs();
            } catch (err) {
                console.error('Error checking admin status:', err);
                router.push('/login');
            }
        };

        checkAdmin();
    }, [router]);

    const loadLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const logsData = await fetchLogs();
            setLogs(logsData);
        } catch (err) {
            console.error('Error loading logs:', err);
            setError('Failed to load logs. Please try again.');
        } finally {
            setLoading(false);
        }
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
                    onClick={loadLogs} 
                    className="ml-4 px-3 py-1 bg-blue-500 text-white rounded">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            
            {adminInfo && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <p>Logged in as admin: <strong>{adminInfo.username}</strong></p>
                    <p className="text-sm text-gray-500">Admin ID: {adminInfo.adminId}</p>
                </div>
            )}
            
            <div>
                <h2 className="text-2xl font-semibold mb-4">System Logs</h2>
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
                                    <td className={`px-4 py-2 ${
                                        log.level === 'error' ? 'text-red-600' : 
                                        log.level === 'warn' ? 'text-yellow-600' : ''
                                    }`}>
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
                
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={loadLogs} 
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                        Refresh Logs
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;