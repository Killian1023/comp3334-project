两个地方有ENCRYPTION，一个在clientencryption.tsx，用于在本地生成用户的encryption key，还有一个是密码hash，在auth.ts里面，用于密码加密。
filehelper.ts用于加密及解密文件。


Section 5: Functionality
The CORE functionalities of your application are listed below:
1. User Management:
a. Register a user by username and password.
i. The username must be unique.
ii. The password must be hashed by a proper algorithm.
b. Log in
i. Check whether the password is identical to the password in
registration.
c. A user should be able to reset its password.
2. Data Encryption:
a. Upload
i. When a user uploads a file, the client should encrypt the file using
an appropriate cryptosystem, with the key securely generated and
stored locally.
ii. Server should not be able to read the file in plaintext.
b. Download
i. When a user downloads a file, the client should decrypt the file and
return the plaintext to the user.
3. Access Control
a. A user can only add/edit/delete its own files.
b. A user can share its files with designated users. The designated users should
be able to read the shared files via their Clients.
c. An unauthorized user should not be able to access the file content of other
users.
4. Log Auditing
a. The critical operations, such as logging in, logging out, uploading, deleting,
sharing, should be recorded.
i. A user should not be able to repudiate it.
b. The administrator account of your application should be able to read logs.
5. General Security Protection
a. File name must be valid. Some file names can be used to attack. For
example, the file name “../file.txt” (without quotes) can be used to access
file.txt in the parent folder.
b. Your application should also consider the security threats on accounts, e.g.,
SQL injections.


The EXTENDED functionalities of your application are listed below:
1. Multi-Factor Authentication (MFA): FIDO2, One-Time Password (OTP),
email/phone verification code, etc.
2. Efficient update on files: Suppose you are editing a file that has already been saved
online. If you want to modify a part of this file, find a method that Client does not
need to encrypt the entire file and submit it again.
3. Other security designs that you think are necessary.


note:
    /app/lib 是數據庫調用，增刪改查
    /app/lib/file.ts 文件處理
    /app/lib/auth.ts 用戶處理
    /app/lib/logger.ts 日誌處理

upload加fileKey，加密文本，用publicKey加密fileKey，將encryptedFileKey發給後端，存在access table
後端存publicKey (Michael):
    /app/api/file/upload 上傳api
    /app/api/file/download 下載api，需要包括下載共享文件的功能
    /app/utils/fileHelper 加密及解密文件的function
    /app/api/auth/getPublicKey 獲取用戶publicKey

註冊生成非對稱密鑰 (Michael)
    /app/utils/clientencryption 生成用戶publickey & secretkey
    /app/api/auth/register 註冊，調用/app/lib/auth.ts寫入用戶數據

實現share，前端獲取共享人的publicKey，用自己的privateKey解密encryptedFileKey，用共享人publicKey加密fileKey，將加密fileKey發給後端，存在access table (Eric)
    /app/api/file/share 共享文件api
    /app/utils/clientencryption 用戶端加密解密function    

改密碼 (Killian)
otp (Killian)