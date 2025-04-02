'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prepareEncryptedFormData, downloadAndDecryptFile } from '@/lib/fileHelper';

interface FileItem {
  id: string;
  encryptedName: string;
  size: number;
  createdAt: string;
}

const FilesPage = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Get current user from local storage
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  };
  
  // Get auth token
  const getAuthToken = () => localStorage.getItem('authToken');
  
  useEffect(() => {
    // Redirect to login if not authenticated
    const token = getAuthToken();
    const user = getCurrentUser();
    
    if (!token || !user) {
      router.push('/login');
      return;
    }
    
    // Fetch user's files
    fetchFiles();
  }, [router]);
  
  const fetchFiles = async () => {
    const token = getAuthToken();
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/files', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      } else {
        setError('Failed to fetch files');
      }
    } catch (error) {
      setError('An error occurred while fetching files');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const user = getCurrentUser();
    const token = getAuthToken();
    
    if (!user || !token) {
      router.push('/login');
      return;
    }
    
    try {
      setUploadStatus('Encrypting file...');
      
      // Prepare encrypted form data
      const formData = await prepareEncryptedFormData(file, user.id);
      
      // Upload the encrypted file
      setUploadStatus('Uploading file...');
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        setUploadStatus('File uploaded successfully!');
        // Refresh file list
        fetchFiles();
        // Clear the file input
        e.target.value = '';
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upload file');
      }
    } catch (error) {
      setError('Error processing file: ' + (error as Error).message);
      console.error(error);
    } finally {
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };
  
  const handleDownload = async (fileId: string) => {
    const user = getCurrentUser();
    const token = getAuthToken();
    
    if (!user || !token) {
      setError('Authentication required. Please log in.');
      setTimeout(() => router.push('/login'), 1000);
      return;
    }
    
    try {
      setIsLoading(true);
      await downloadAndDecryptFile(fileId, user.id);
    } catch (error) {
      // Provide more informative error messages
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Authentication token')) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError('Error downloading file: ' + errorMessage);
      }
      console.error('Download error details:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Files</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
          <button 
            className="text-sm underline" 
            onClick={() => setError('')}
          >
            Dismiss
          </button>
        </div>
      )}
      
      <div className="mb-8 p-4 border border-gray-200 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Upload a New File</h2>
        <p className="mb-4 text-sm text-gray-600">
          Files are encrypted in your browser before being uploaded. Only you can decrypt and access them.
        </p>
        <input
          type="file"
          onChange={handleFileUpload}
          className="block w-full mb-4"
          disabled={isLoading}
        />
        {uploadStatus && (
          <p className="text-sm text-blue-600">{uploadStatus}</p>
        )}
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Encrypted Files</h2>
        {isLoading ? (
          <p>Loading files...</p>
        ) : files.length > 0 ? (
          <div className="overflow-x-auto">
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
                {files.map(file => (
                  <tr key={file.id}>
                    <td className="py-2 px-4 border-b">Encrypted File</td>
                    <td className="py-2 px-4 border-b">{(file.size / 1024).toFixed(2)} KB</td>
                    <td className="py-2 px-4 border-b">
                      {new Date(file.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => handleDownload(file.id)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2"
                        disabled={isLoading}
                      >
                        Download & Decrypt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">You haven't uploaded any files yet.</p>
        )}
      </div>
    </div>
  );
};

export default FilesPage;