import React, { useState } from 'react';
import { downloadAndDecryptFile } from '@/app/utils/fileHelper';

interface FileItem {
  id: string;
  encryptedName: string;
  size: number;
  createdAt: string;
}

interface FileListProps {
  files: FileItem[];
  onRefresh: () => void;
}

const FileList = ({ files, onRefresh }: FileListProps) => {
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Get current user ID from local storage
    const getCurrentUserId = (): string | null => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            const user = JSON.parse(userStr);
            return user?.id || null;
        } catch (e) {
            console.error('Error getting user ID:', e);
            return null;
        }
    };
    
    const handleDownload = async (fileId: string) => {
        const userId = getCurrentUserId();
        if (!userId) {
            setError('Please log in to download files');
            return;
        }
        
        setIsDownloading(fileId);
        setError(null);
        
        try {
            await downloadAndDecryptFile(fileId, userId);
        } catch (err) {
            console.error('Download error:', err);
            setError(`Failed to download file: ${(err as Error).message}`);
        } finally {
            setIsDownloading(null);
        }
    };

    if (files.length === 0) {
        return <p className="text-gray-500">No files found.</p>;
    }

    return (
        <div className="mt-4">
            <h2 className="text-xl font-semibold mb-3">Your Encrypted Files</h2>
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-3">
                    <p>{error}</p>
                    <button 
                      className="text-sm underline" 
                      onClick={() => setError(null)}
                    >
                      Dismiss
                    </button>
                </div>
            )}
            <table className="min-w-full bg-white border border-gray-200">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">File</th>
                        <th className="py-2 px-4 border-b">Size</th>
                        <th className="py-2 px-4 border-b">Uploaded</th>
                        <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {files.map((file) => (
                        <tr key={file.id}>
                            <td className="py-2 px-4 border-b">Encrypted File</td>
                            <td className="py-2 px-4 border-b">
                                {(file.size / 1024).toFixed(2)} KB
                            </td>
                            <td className="py-2 px-4 border-b">
                                {new Date(file.createdAt).toLocaleString()}
                            </td>
                            <td className="py-2 px-4 border-b">
                                <button
                                    onClick={() => handleDownload(file.id)}
                                    disabled={isDownloading !== null}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2 disabled:bg-gray-400"
                                >
                                    {isDownloading === file.id 
                                        ? 'Decrypting...' 
                                        : 'Download & Decrypt'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FileList;