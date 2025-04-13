# SecureFileVault

A secure file management application with client-side encryption, access control, and comprehensive audit logging.

## Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, Web Crypto API
- **Backend**: Next.js API Routes, SQLite, Drizzle ORM
- **Authentication**: JWT, bcrypt
- **Encryption**: ES-256, Asymmetric Encryption
- **Deployment**: Node.js environment

## Features

- **User Management**: Registration, login, and password reset
- **End-to-End Encryption**: Client-side file encryption using ES-256
- **Access Control**: File sharing with specific users and permission management
- **Audit Logging**: Comprehensive logging of all user actions with non-repudiation
- **Security Measures**: Protection against common security threats including SQL injection and path traversal

## Prerequisites

The following software is required to run this application:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (included with Node.js)
- [Python 3](https://www.python.org/) (for administrative tasks)

## Installation Guide for Windows 11

### 1. Install Node.js and npm

1. Visit [Node.js official website](https://nodejs.org/)
2. Download the LTS (Long Term Support) version for Windows
3. Run the installer and follow the installation wizard
4. To verify the installation, open Command Prompt and run:
   ```
   node --version
   npm --version
   ```

### 2. Extract the Project Files

1. Extract the project ZIP file to a location of your choice
2. Open Command Prompt and navigate to the extracted directory

### 3. Start the Application

```
npm start
```

After starting, the application will be accessible at `http://localhost:3000`.

### 4. Configure SSL/TLS Certificates (HTTPS)

To securely access the application via HTTPS, you need to configure SSL/TLS certificates:

#### Using Self-Signed Certificates (Development Environment)

1. Generate a self-signed certificate:
   ```
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./cert/key.pem -out ./cert/cert.pem
   ```

2. Create or modify the `next.config.js` file with the following content:
   ```javascript
   const fs = require('fs');
   const path = require('path');
   
   module.exports = {
     server: {
       https: {
         key: fs.readFileSync(path.resolve('./cert/key.pem')),
         cert: fs.readFileSync(path.resolve('./cert/cert.pem'))
       }
     }
   };
   ```

3. Modify the start scripts in `package.json`:
   ```json
   "scripts": {
     "dev": "next dev --https",
     "start": "next start --https"
   }
   ```

#### Using Production Certificates

1. Obtain an SSL/TLS certificate from a Certificate Authority (CA) such as Let's Encrypt
2. Place the certificate files (typically `.pem` or `.crt` and `.key` files) in a secure location
3. Configure `next.config.js` to point to your certificates:
   ```javascript
   const fs = require('fs');
   const path = require('path');
   
   module.exports = {
     server: {
       https: {
         key: fs.readFileSync(path.resolve('/path/to/your/key.pem')),
         cert: fs.readFileSync(path.resolve('/path/to/your/cert.pem'))
       }
     }
   };
   ```

4. For production environments, it is recommended to use a reverse proxy like Nginx or Apache to handle SSL termination

## Usage Guide

### User Registration

1. Navigate to the registration page at `http://localhost:3000/register`
2. Enter a unique username, email, and a secure password
3. During registration, cryptographic keys will be generated for file encryption
4. Your private key will be securely stored in your browser's local storage
5. **Important**: Make sure to backup your private key code! The system will display your private key after registration is complete. Please copy and store it securely. If your browser data is lost, you will not be able to recover your encrypted files without a backup of your private key.

### Login

1. Visit `http://localhost:3000/login`
2. Enter your username and password
3. Upon successful login, you'll be redirected to your file dashboard

### File Management

#### Uploading Files

1. Click on "Upload" in the dashboard
2. Select a file from your computer
3. The file will be encrypted in your browser before being sent to the server
4. The server only stores the encrypted file, and cannot access the contents

#### Downloading Files

1. Select a file in your dashboard
2. Click "Download"
3. The encrypted file will be downloaded and decrypted in your browser
4. The decrypted file will be saved to your computer

#### Sharing Files

1. Select a file in your dashboard
2. Click "Share"
3. Enter the username of the user you want to share with
4. The system will securely share the encryption key with the designated user using their public key

### Administrator Functions

1. Login with an administrator account
   - Username: 3334Admin
   - Password: Iam3334admin
   - Private Key: eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6Im1rTmZycnROMG16ajBJdVdoQ1ZsSERxdWc0aEZjVy05VHFLZnZ3TU5RUDAiLCJ5Ijoicjl1VlJEa0cteGd1M2RGTjFXeF9qTi1idzBBTUFCM1ZkMG1YTE95d2pOayIsImQiOiJQbmtWaVVzVzV1S3M1eTA5Mld2dXFMUTVSNU9JT2FodUhOWF8zdHFkTzY0In0=
2. Navigate to `http://localhost:3000/admin`
3. View audit logs with user signatures for non-repudiation
4. Manage system settings

## Architecture

### Frontend
- Next.js 15
- React 19
- TailwindCSS for styling
- Client-side encryption using Web Crypto API

### Backend
- Next.js API routes
- SQLite with Drizzle ORM
- JWT for authentication
- bcrypt for password hashing

### Security Features
- ES-256 encryption for files
- Public/private key pairs for secure key exchange
- Non-repudiation through action signatures
- Secure password hashing
- Protection against SQL injection
- Input validation and sanitization

## Database Schema

The application uses the following tables:
- `users`: User account information and public keys
- `files`: Encrypted file metadata and binary data
- `file_access`: File sharing permissions and encrypted keys
- `logs`: Audit logs for all actions with signatures
- `admins`: Administrator accounts

## Development

To run the development server with faster compilation:
```
npm run dev
```

## Troubleshooting

### Common Issues

1. **Cryptographic Issues**:
   - Make sure your browser supports the Web Crypto API (all modern browsers do)
   - If keys are not generating, try clearing browser localStorage

2. **Connection Refused**:
   - Verify that the application is running and not blocked by firewall
   - Check that port 3000 is available

3. **File Upload Issues**:
   - Ensure file permissions are correct
   - Check browser console for any JavaScript errors

4. **Certificate Issues**:
   - Self-signed certificates will show warnings in browsers, which is normal in development environments
   - For production, ensure you use certificates from a trusted CA

## License

This project is licensed under the MIT License - see the LICENSE file for details.