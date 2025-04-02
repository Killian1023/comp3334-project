import React from 'react';
import FileList from '../../components/files/FileList';
import FileUpload from '../../components/files/FileUpload';

const FilesPage = () => {
    return (
        <div>
            <h1>Your Files</h1>
            <FileUpload />
            <FileList />
        </div>
    );
};

export default FilesPage;