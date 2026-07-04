import defaultImage from '@/assets/image.png';
import defaultAvatar from '@/assets/avatar.png';

const getImageUrl = (src: string) => `${import.meta.env.VITE_API_URL}/file/${src}`;
const getImageHtml = (src: string) => `<img src="${src}" class="size-20 rounded object-cover mx-auto" />`;
const useFormat = (format?: 'url' | 'html', src?: string, defaultImageToUse?: string) => {
    if (src) return format === 'html' ? getImageHtml(getImageUrl(src)) : getImageUrl(src);
    return format === 'html' ? getImageHtml(defaultImageToUse!) : defaultImageToUse!;
};

export const previewImage = (options: { src?: string; type?: 'avatar' | 'image', format?: 'url' | 'html' }) => {
    let defaultImageToUse = defaultImage;
    if (options.type === 'avatar') defaultImageToUse = defaultAvatar;
    return useFormat(options.format, options.src, defaultImageToUse);
};