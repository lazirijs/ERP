import defaultImage from '@/assets/image.png';
import defaultAvatar from '@/assets/avatar.png';

// Build a download/preview URL for any stored file (documents, invoices, ...)
export const getFileUrl = (key: string) => `${import.meta.env.VITE_API_URL}/file/${key}`;

const getImageHtml = (src: string) => `<img src="${src}" class="size-20 rounded object-cover mx-auto" />`;
const useFormat = (format?: 'url' | 'html', src?: string, defaultImageToUse?: string) => {
    if (src) return format === 'html' ? getImageHtml(getFileUrl(src)) : getFileUrl(src);
    return format === 'html' ? getImageHtml(defaultImageToUse!) : defaultImageToUse!;
};

export const previewImage = (options: { src?: string; type?: 'avatar' | 'image', format?: 'url' | 'html' }) => {
    let defaultImageToUse = defaultImage;
    if (options.type === 'avatar') defaultImageToUse = defaultAvatar;
    return useFormat(options.format, options.src, defaultImageToUse);
};

export const getFileExtension = (key: string) => (key.split('.').pop() || '').toLowerCase();
export const isImage = (key: string) => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(getFileExtension(key));