'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { downloadAndDecryptFile } from '@/app/utils/fileHelper';
import { logoutUser, getCurrentUser, getAuthToken, isAuthenticated } from '@/app/utils/authUtils';
import FileUpload from '../components/files/FileUpload';
import Link from 'next/link';
import { getCurrentUserPrivateKey, decryptFileKey, encryptFileKey } from '../utils/fileKeyEncryption';

interface FileItem {
  id: string;
  originalName: string;
  size: number;
  createdAt: string;
  iv?: string;
  ownerId?: string;
  ownerName?: string;
}

interface ShareUser {
  id: string;
  username: string;
  email: string;
}

const FilesPage = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [sharedFiles, setSharedFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('myFiles');
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isSharingFile, setIsSharingFile] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUsers, setShareUsers] = useState<ShareUser[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string>('');
  const [loadingShareList, setLoadingShareList] = useState(false);
  
  const router = useRouter();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<FileItem | null>(null);
  
  useEffect(() => {
    const token = getAuthToken();
    const user = getCurrentUser();
    
    if (!token || !user) {
      router.push('/login');
      return;
    }
    
    fetchFiles();
    fetchSharedFiles();
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

  const fetchSharedFiles = async () => {
    const token = getAuthToken();
    if (!token) return;
    
    try {
      setIsLoadingShared(true);
      const response = await fetch('/api/files/share-file-list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSharedFiles(data.files);
      } else {
        console.error('Failed to fetch shared files list');
      }
    } catch (error) {
      console.error('An error occurred while fetching shared files', error);
    } finally {
      setIsLoadingShared(false);
    }
  };
  
  const handleDownload = async (fileId: string, isShare?: string) => {
    const user = getCurrentUser();
    const token = getAuthToken();
    
    if (!user || !token) {
      setError('Authentication required to download files');
      setTimeout(() => router.push('/login'), 1000);
      return;
    }
    
    try {
      setIsLoading(true);
      await downloadAndDecryptFile(fileId, user.id, isShare);
    } catch (error) {
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

  const handleShare = async (fileId: string) => {
    const user = getCurrentUser();
    const token = getAuthToken();
    
    if (!user || !token) {
      setError('Authentication required to share files');
      setTimeout(() => router.push('/login'), 1000);
      return;
    }
    
    try {
      setIsSharingFile(fileId);
      setCurrentFileId(fileId);
      setLoadingShareList(true);
      
      const response = await fetch(`/api/files/share-user-list?fileId=${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setShareUsers(data.users);
        setShowShareModal(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get share list');
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError('Error sharing file: ' + errorMessage);
      console.error('Share error details:', error);
    } finally {
      setIsSharingFile(null);
      setLoadingShareList(false);
    }
  };

  const handleShareWithUser = async (userId: string) => {
    let publicKey = '';
    let existingEncryptedFileKey = '';
    const token = getAuthToken();
    if (!token || !currentFileId) return;
    
    try {
      setIsLoading(true);

      const publicKeyResponse = await fetch(`/api/users/public-key?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (publicKeyResponse.ok) {
        const data = await publicKeyResponse.json();
        publicKey = data.publicKey;
      } else {
        const errorData = await publicKeyResponse.json();
        throw new Error(errorData.message || 'Failed to get public key');
      }

      const privateKey = getCurrentUserPrivateKey();
      if (!privateKey) {
        throw new Error('Private key not found. Please log in again.');
      }

      const encryptedFileKeyResponse = await fetch(`/api/files/encrypted-file-key?fileId=${currentFileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Encrypted file key response:', encryptedFileKeyResponse);

      if (encryptedFileKeyResponse.ok) {
        const data = await encryptedFileKeyResponse.json();
        console.log('Encrypted file key response:', data);
        existingEncryptedFileKey = data.encryptedFileKey;
        console.log('Encrypted file key:', existingEncryptedFileKey);
      } else {
        const errorData = await encryptedFileKeyResponse.json();
        throw new Error(errorData.message || 'Failed to get public key');
      }

      const decryptedFileKey = await decryptFileKey(existingEncryptedFileKey, privateKey);
      
      const encryptedFileKey = await encryptFileKey(decryptedFileKey, publicKey);
      
      const response = await fetch('/api/files/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ownerId: getCurrentUser()?.id,
          fileId: currentFileId,
          sharedWithUserId: userId,
          encryptedFileKey: encryptedFileKey
        })
      });
      
      if (response.ok) {
        setShowShareModal(false);
        alert('File shared successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to share file');
      }
    } catch (error) {
      setError('Error sharing file: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (file: FileItem) => {
    setFileToEdit(file);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setFileToEdit(null);
    fetchFiles();
    setError('');
  };

  const handleLogout = async () => {
    setIsLogoutLoading(true);
    
    try {
      await logoutUser();
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
            onClick={() => {
              fetchFiles();
              fetchSharedFiles();
            }} 
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            disabled={isLoading || isLoadingShared}
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
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('myFiles')}
                className={`flex-1 py-3 px-4 text-center font-medium text-sm ${
                  activeTab === 'myFiles'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                我的檔案
              </button>
              <button
                onClick={() => setActiveTab('sharedFiles')}
                className={`flex-1 py-3 px-4 text-center font-medium text-sm ${
                  activeTab === 'sharedFiles'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                分享給我的檔案
                {sharedFiles.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {sharedFiles.length}
                  </span>
                )}
              </button>
            </div>
            
            {activeTab === 'myFiles' && (
              <>
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">我的檔案</h2>
                </div>
                
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    <p className="text-gray-500">載入檔案中...</p>
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
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(file)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md flex items-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                              disabled={isLoading}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleShare(file.id)}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md flex items-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                              disabled={isLoading || isSharingFile === file.id}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                              </svg>
                              Share
                            </button>
                            <button
                              onClick={() => handleDownload(file.id, "false")}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex items-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              disabled={isLoading}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 mb-2">您尚未上傳任何檔案</p>
                    <p className="text-sm text-gray-400">使用左側上傳區域加入您的第一個加密檔案</p>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'sharedFiles' && (
              <>
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">分享給我的檔案</h2>
                </div>
                
                {isLoadingShared ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    <p className="text-gray-500">載入分享檔案中...</p>
                  </div>
                ) : sharedFiles.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {sharedFiles.map(file => (
                      <div key={file.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                              </svg>
                              <span className="font-medium text-gray-800">{file.originalName}</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Size: {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDownload(file.id,"true")}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex items-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              disabled={isLoading}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <p className="text-gray-500 mb-2">目前沒有分享給您的檔案</p>
                    <p className="text-sm text-gray-400">當其他用戶與您共享檔案後，將會顯示在這裡</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isEditModalOpen && fileToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Edit File: {fileToEdit.originalName}
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setFileToEdit(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Upload a new version of this file. The file will be encrypted before uploading.
              </p>
              <FileUpload 
                onFileUploaded={handleEditSuccess} 
                isEdit={true} 
                fileToEdit={fileToEdit}
              />
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Share File
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Select a user to share the file with.
              </p>
              {loadingShareList ? (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-gray-500">Loading users...</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {shareUsers.map(user => (
                    <li key={user.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <button
                        onClick={() => handleShareWithUser(user.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Share
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesPage;