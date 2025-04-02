import React from 'react';

const FileList = ({ files }) => {
    return (
        <div>
            <h2>Your Uploaded Files</h2>
            <ul>
                {files.map((file) => (
                    <li key={file.id}>
                        <a href={`/api/files/download/${file.id}`}>{file.name}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FileList;