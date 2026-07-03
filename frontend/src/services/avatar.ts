import defaultAvatar from '@/assets/avatar.png';

export const getAvatar = (picture?: string, local: boolean = false) => {
    if (local) return picture || defaultAvatar;
    return picture ? `${import.meta.env.VITE_API_URL}/file/${picture}` : defaultAvatar;
};