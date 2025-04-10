import React, { useState, useRef } from 'react';
import axios from 'axios';
import { prepareEncryptedFileUpload } from '@/app/utils/fileHelper';

// Define FileItem interface
interface FileItem {
  id: string;
  originalName: string;
  size: number;
  createdAt: string;
  iv?: string;
}

interface FileUploadProps {
  onFileUploaded?: () => void;
  isEdit?: boolean;
  fileToEdit?: FileItem;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, isEdit = false, fileToEdit }) => {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Set action text based on whether we're editing or uploading
    const actionText = isEdit ? 'Update' : 'Upload';
    const titleText = isEdit ? `Update File: ${fileToEdit?.originalName}` : 'Secure File Upload';

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setError('');
            setSuccess('');
            setUploadProgress(0);
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError('');
            setSuccess('');
            setUploadProgress(0);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        setIsUploading(true);
        setError('');
        setUploadProgress(0);
        
        try {
            // Get user information
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            
            if (!user || !user.id) {
                setError('You must be logged in to upload files');
                setIsUploading(false);
                return;
            }
            
            // Get authentication token
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication token not found. Please log in again');
                setIsUploading(false);
                return;
            }

            // Encrypt file
            setUploadProgress(10);
            const formData = await prepareEncryptedFileUpload(file);
            
            // Add user ID
            formData.append('userId', user.id);
            
            // If we're editing, add the fileId to the form data
            if (isEdit && fileToEdit) {
                formData.append('fileId', fileToEdit.id);
            }
            
            setUploadProgress(50);
            
            // Use different endpoints for edit vs. upload
            const uploadEndpoint = isEdit 
                ? '/api/files/edit' 
                : '/api/files/upload';
            
            // Upload encrypted file
            const response = await axios.post(uploadEndpoint, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round(
                            ((progressEvent.loaded / progressEvent.total) * 50) + 50
                        );
                        setUploadProgress(percentCompleted);
                    }
                }
            });
            
            setUploadProgress(100);
            setSuccess(`File ${isEdit ? 'updated' : 'encrypted and uploaded'} successfully!`);
            setFile(null);
            
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            // Call callback function to notify parent component
            if (onFileUploaded) {
                onFileUploaded();
            }
            
        } catch (err) {
            console.error(`${isEdit ? 'Update' : 'Upload'} error:`, err);
            setError(`Error ${isEdit ? 'updating' : 'encrypting or uploading'} file. Please try again`);
        } finally {
            setTimeout(() => {
                if (uploadProgress === 100) {
                    setUploadProgress(0);
                }
                setIsUploading(false);
            }, 1000);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{titleText}</h3>
            
            <div 
                className={`border-2 border-dashed p-8 rounded-lg mb-4 text-center cursor-pointer transition-all duration-300 ${
                    isDragging 
                        ? 'border-blue-500 bg-blue-50' 
                        : file 
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                onClick={triggerFileInput}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input 
                    ref={fileInputRef}
                    id="fileInput"
                    type="file" 
                    onChange={handleFileChange} 
                    className="hidden"
                    disabled={isUploading}
                />
                
                <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="text-4xl text-gray-400">
                        {file ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        )}
                    </div>
                    
                    {file ? (
                        <div className="mt-2">
                            <p className="text-sm font-medium text-gray-900">Selected file:</p>
                            <p className="text-sm text-gray-700 break-all">{file.name}</p>
                            <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-700 font-medium">
                                {isEdit 
                                    ? "Drag and drop new version here or click to browse" 
                                    : "Drag and drop file here or click to browse"}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Files are encrypted in your browser before upload</p>
                        </div>
                    )}
                </div>
            </div>
            
            {uploadProgress > 0 && (
                <div className="w-full mb-4">
                    <div className="relative pt-1">
                        <div className="flex items-center justify-between mb-1">
                            <div>
                                <span className="text-xs font-medium text-blue-600">
                                    {uploadProgress < 50 ? 'Encrypting...' : 'Uploading...'}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs font-medium text-blue-600">{uploadProgress}%</span>
                            </div>
                        </div>
                        <div className="flex h-2 overflow-hidden rounded bg-blue-100">
                            <div
                                style={{ width: `${uploadProgress}%` }}
                                className="transition-all duration-300 bg-blue-500"
                            ></div>
                        </div>
                    </div>
                </div>
            )}
            
            <button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
                className={`w-full py-3 rounded-md font-medium text-white shadow transition-all duration-300 ${
                    !file || isUploading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
            >
                {isUploading ? 'Processing...' : isEdit ? 'Update File' : 'Secure Upload'}
            </button>
            
            {error && (
                <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}
            
            {success && (
                <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;