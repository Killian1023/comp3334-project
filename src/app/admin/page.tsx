'use client';

import React from 'react';
import { useEffect, useState } from 'react';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            const usersData = await fetchUsers();
            const logsData = await fetchLogs();
            setUsers(usersData);
            setLogs(logsData);
        };

        loadData();
    }, []);

    return (
        <div>
            <h1>Admin Dashboard</h1>
            <h2>User Management</h2>
            <ul>
                {users.map(user => (
                    <li key={user.id}>{user.username}</li>
                ))}
            </ul>
            <h2>Log Auditing</h2>
            <ul>
                {logs.map(log => (
                    <li key={log.id}>{log.action} - {log.timestamp}</li>
                ))}
            </ul>
        </div>
    );
};

export default AdminPage;