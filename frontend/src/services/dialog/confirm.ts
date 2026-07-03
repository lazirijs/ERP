import { ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Option {
    title: string;
    message: string;
    confirmButtonText: string;
    confirmButtonType: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
    cancelButtonText: string;
    type: 'success' | 'warning' | 'info' | 'error';
}

interface OptionType {
    save: Option;
    delete: Option;
    edit: Option;
    confirm: Option;
}

const options: OptionType = {
    save: {
        title: 'saveData',
        message: 'areYouSureYouWantToSaveThisData',
        confirmButtonText: 'save',
        confirmButtonType: 'primary',
        cancelButtonText: 'cancel',
        type: 'success',
    },
    delete: {
        title: 'deleteData',
        message: 'areYouSureYouWantToDeleteThisItem',
        confirmButtonText: 'delete',
        confirmButtonType: 'danger',
        cancelButtonText: 'cancel',
        type: 'warning',
    },
    edit: {
        title: 'editData',
        message: 'areYouSureYouWantToEditThisItem',
        confirmButtonText: 'edit',
        confirmButtonType: 'primary',
        cancelButtonText: 'cancel',
        type: 'info',
    },
    confirm: {
        title: 'confirmAction',
        message: 'areYouSureYouWantToConfirmThisAction',
        confirmButtonText: 'confirm',
        confirmButtonType: 'primary',
        cancelButtonText: 'cancel',
        type: 'info',
    }
}

type ConfirmParams = {
    type: keyof OptionType;
} | {
    option: Option;
}

export default async (params: ConfirmParams) => {
    let option: Option;
    if ('type' in params) {
        option = options[params.type];
    } else {
        option = params.option;
    }
    return await ElMessageBox.confirm(
        t(option.message),
        t(option.title),
        {
            confirmButtonText: t(option.confirmButtonText),
            confirmButtonType: option.confirmButtonType,
            cancelButtonText: t(option.cancelButtonText),
            type: option.type,
        }
    )
};