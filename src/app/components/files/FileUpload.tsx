import React, { useState } from 'react';
import axios from 'axios';
import { prepareEncryptedFormData } from '@/app/utils/fileHelper';

const FileUpload = () => {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setError('');
            setSuccess('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        setIsUploading(true);
        setError('');
        
        try {
            // Get user ID from localStorage
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            
            if (!user || !user.id) {
                setError('You must be logged in to upload files.');
                return;
            }
            
            // Get auth token
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication token not found. Please log in again.');
                return;
            }

            // Encrypt file client-side before uploading
            const formData = await prepareEncryptedFormData(file, user.id);
            
            // Upload the encrypted file
            const response = await axios.post('/api/files/upload', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });
            
            setSuccess('File encrypted and uploaded successfully!');
            setFile(null);
            
            // Reset file input
            const fileInput = document.getElementById('fileInput') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            
        } catch (err) {
            console.error('Upload error:', err);
            setError('Error encrypting or uploading file. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-2">Upload Encrypted File</h3>
            <p className="text-sm text-gray-600 mb-3">
                Files are encrypted in your browser before upload for maximum security.
            </p>
            <input 
                id="fileInput"
                type="file" 
                onChange={handleFileChange} 
                className="block w-full mb-3 text-sm"
                disabled={isUploading}
            />
            <button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
                {isUploading ? 'Encrypting & Uploading...' : 'Upload Securely'}
            </button>
            {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
            {success && <p className="mt-2 text-green-600 text-sm">{success}</p>}
        </div>
    );
};

export default FileUpload;