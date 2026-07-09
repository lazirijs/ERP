import defaultImage from '@/assets/image.png';
import defaultAvatar from '@/assets/avatar.png';

// Build a download/preview URL for any stored file (documents, invoices, ...)
export const getFileUrl = (key: string) => `${import.meta.env.VITE_API_URL}/file/${key}`;

const getImageHtml = (src: string, type?: 'avatar' | 'image') => `<img src="${src}" class="${type === 'avatar' ? 'avatar-preview' : 'img-preview'}" style="margin: 0 auto;" />`;
const useFormat = (format?: 'url' | 'html', src?: string | null, defaultImageToUse?: string, type?: 'avatar' | 'image') => {
    if (src) return format === 'html' ? getImageHtml(getFileUrl(src), type) : getFileUrl(src);
    return format === 'html' ? getImageHtml(defaultImageToUse!, type) : defaultImageToUse!;
};

export const previewImage = (options: { src?: string | null; type?: 'avatar' | 'image', format?: 'url' | 'html' }) => {
    let defaultImageToUse = defaultImage;
    if (options.type === 'avatar') defaultImageToUse = defaultAvatar;
    return useFormat(options.format, options.src, defaultImageToUse, options.type);
};

export const getFileExtension = (key: string) => (key.split('.').pop() || '').toLowerCase();
export const isImage = (key: string) => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(getFileExtension(key));