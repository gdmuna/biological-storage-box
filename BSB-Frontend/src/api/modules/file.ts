import { alovaInstance } from '../client';

export const uploadFile = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return alovaInstance.Post<{ url: string; filename: string; size: number }>(
        '/file/upload',
        formData
    );
};

export const serverUploadImage = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('domain', 'AVATAR');
    formData.append('filename', file.name);
    return alovaInstance.Post<{ fileId: string }>('/files/server-upload', formData);
};

export const getPublicFileUrl = (fileId: string) =>
    alovaInstance.Get<string>(`/files/${fileId}/public-url`);
