import { alovaInstance } from '../client';

export const uploadFile = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return alovaInstance.Post<{ url: string; filename: string; size: number }>(
        '/file/upload',
        formData,
    );
};
