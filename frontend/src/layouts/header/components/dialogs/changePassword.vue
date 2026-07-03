<template>
    <el-dialog v-model="dialogModel" :title="$t('changePassword')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="close()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
        <el-form v-loading="loadingContainer.includes('submit')" ref="formRef" class="w-full" label-position="top" :model="formData" :rules="formRules" @submit.prevent="submit()">
            <el-form-item :label="$t('currentPassword')" prop="currentPassword">
                <el-input v-model="formData.currentPassword" type="password" placeholder="*******" />
            </el-form-item>
            <el-form-item :label="$t('newPassword')" prop="newPassword">
                <el-input v-model="formData.newPassword" type="password" placeholder="*******" />
            </el-form-item>
            <el-form-item :label="$t('confirmPassword')" prop="confirmPassword">
                <el-input v-model="formData.confirmPassword" type="password" placeholder="*******" />
            </el-form-item>
            <el-form-item class="mb-0! mt-8">
                <el-button @click="reset()" text>
                    {{ $t("reset") }}
                </el-button>
                <div class="ml-auto">
                    <el-button @click="close()">
                        {{ $t("close") }}
                    </el-button>
                    <el-button type="primary" @click="submit()">
                        {{ $t("save") }}
                    </el-button>
                </div>
            </el-form-item>
        </el-form>
    </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue"
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { useI18n } from "vue-i18n";
import AuthApi from '@/modules/auth/api';
import type { ChangePasswordBody } from "@/modules/auth/type";

const { t } = useI18n();
const authApi = new AuthApi();

const dialogModel = ref<boolean>(false);

const loadingContainer = ref<('submit')[]>([]);

const formRef = ref<FormInstance>();

const formData = ref<ChangePasswordBody>({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const passwordRules = [
  { required: true, message: t('required'), trigger: 'submit' },
  { min: 6, message: t('minLength6'), trigger: 'submit' }
]

const formRules = reactive<FormRules>({
  currentPassword: passwordRules,
  newPassword: passwordRules,
  confirmPassword: [ ...passwordRules, { validator: (_, value, callback) => {
    if (value !== formData.value.newPassword) {
      callback(new Error(t('passwordsDoNotMatch')));
    } else {
      callback();
    }
  }, trigger: 'blur' } ]
});

const reset = (formEl: FormInstance | undefined = formRef.value) => {
  if (!formEl) return;
  formEl.resetFields();
};

const close = (formEl: FormInstance | undefined = formRef.value) => {
  reset(formEl);
  dialogModel.value = false;
};

const submit = async (formEl: FormInstance | undefined = formRef.value) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      try {
        loadingContainer.value.push("submit");
        await authApi.changePassword(formData.value);
        ElMessage.success(t('passwordChangedSuccessfully'));
        close(formEl);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToChangePassword');
        ElMessage.error(errorMessage);
      } finally {
        loadingContainer.value = loadingContainer.value.filter(item => item !== "submit");
      }
    } else {
      const firstError = Object.values(fields!)[0][0];
      ElMessage.error(`${t(firstError.field!)}: ${firstError.message}`);
    }
  })
};

defineExpose({
  open: () => dialogModel.value = true
});
</script>