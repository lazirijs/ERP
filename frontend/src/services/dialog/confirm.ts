import { ElMessageBox } from 'element-plus';
import { t } from '@/translate';

interface Option {
    title: string;
    message: string;
    confirmButtonText: string;
    confirmButtonType: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
    cancelButtonText: string;
    type: 'success' | 'warning' | 'info' | 'error';
}

// type ConfirmParams = { type: keyof OptionType; } | { option: Option; }

export default async (params: Option) => {
    return await ElMessageBox.confirm(
        t(params.message),
        t(params.title),
        {
            confirmButtonText: t(params.confirmButtonText),
            confirmButtonType: params.confirmButtonType,
            cancelButtonText: t(params.cancelButtonText),
            type: params.type,
        }
    )
};