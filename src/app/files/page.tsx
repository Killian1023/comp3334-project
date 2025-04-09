'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { downloadAndDecryptFile, prepareEncryptedFileUpload } from '@/app/utils/fileHelper';
import FileUpload from '../components/files/FileUpload';
import Link from 'next/link';

interface FileItem {
  id: string;
  originalName: string;
  size: number;
  createdAt: string;
}

const FilesPage = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
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
        setError('Failed to fetch file list');
      }
    } catch (error) {
      setError('An error occurred while fetching files');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = async (fileId: string) => {
    const user = getCurrentUser();
    const token = getAuthToken();
    
    if (!user || !token) {
      setError('Authentication required to download files');
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
        setError('Your session has expired. Please log in again');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError('Error downloading file: ' + errorMessage);
      }
      console.error('Download error details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutLoading(true);
    
    try {
      // Clear all user-related data from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('privateKey');
      
      // Clear any encryption keys
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.startsWith('encryptionKey_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Navigate to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out properly. Please try again.');
      setIsLogoutLoading(false);
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Encrypted Files</h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={fetchFiles} 
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={handleLogout}
            disabled={isLogoutLoading}
            className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isLogoutLoading ? 'Logging out...' : 'Log out'}
          </button>
          <Link href="/reset-password" className="text-sm text-gray-600 hover:text-gray-800">Reset Password</Link>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
              <button 
                className="text-xs text-red-600 hover:text-red-800 font-medium underline mt-1" 
                onClick={() => setError('')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <FileUpload onFileUploaded={fetchFiles} />
            <div className="mt-6 bg-blue-50 rounded-lg p-4 shadow-sm">
              <h3 className="font-medium text-blue-800 mb-2">End-to-End Encryption</h3>
              <p className="text-sm text-blue-700">
                All files are encrypted in your browser before upload, ensuring only you can access your data.
              </p>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">File List</h2>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-gray-500">Loading files...</p>
              </div>
            ) : files.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {files.map(file => (
                  <div key={file.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="font-medium text-gray-800">{file.originalName}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Size: {(file.size / 1024).toFixed(2)} KB
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Uploaded: {new Date(file.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(file.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex items-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        disabled={isLoading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download & Decrypt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 mb-2">You haven't uploaded any files yet</p>
                <p className="text-sm text-gray-400">Use the upload area on the left to add your first encrypted file</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilesPage;