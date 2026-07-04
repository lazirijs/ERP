<template>
    <el-dialog v-model="dialogModel" :title="$t('profile')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="hideUpdateProfileForm()" :before-close="(done: any) => !loadingContainer.includes('submitUpdateProfile') && done()">
        <el-form v-if="isEdit && updateProfileFormData" ref="updateProfileFormRef" v-loading="loadingContainer.includes('submitUpdateProfile')" :model="updateProfileFormData" :rules="updateProfileFormRules" @submit.prevent="submitUpdateProfile()" label-position="top" class="w-full">
            <div class="size-26 mx-auto my-6 overflow-hidden rounded-full bg-gray-100 border border-gray-200">
              <img :src="$previewImage({ type: 'avatar' })" class="object-cover size-full" />
            </div>
            <el-form-item :label="$t('name')" prop="name">
                <el-input v-model="updateProfileFormData.name" placeholder="User" />
            </el-form-item>
            <el-form-item :label="$t('email')" prop="email">
                <el-input v-model="updateProfileFormData.email" type="email" placeholder="user@mail.com" />
            </el-form-item>
            <!-- <el-form-item :label="$t('phone')" prop="phone">
                <el-input v-model="updateProfileFormData.phone" placeholder="+213 555 555 555" />
            </el-form-item> -->
            <el-form-item class="mb-0! mt-8">
                <el-button @click="resetUpdateProfileForm()" text>
                    {{ $t("reset") }}
                </el-button>
                <div class="ml-auto">
                    <el-button @click="hideUpdateProfileForm()">
                        {{ $t("close") }}
                    </el-button>
                    <el-button type="primary" @click="submitUpdateProfile()">
                        {{ $t("save") }}
                    </el-button>
                </div>
            </el-form-item>
        </el-form>
        <div v-else class="space-y-4">
            <div class="size-26 mx-auto my-6 overflow-hidden rounded-full bg-gray-100 border border-gray-200">
              <img :src="$previewImage({ type: 'avatar' })" class="object-cover size-full" />
            </div>
            <h1 class="text-center text-xl font-bold">{{ authStore.profile?.name }}</h1>
            <el-card class="space-y-4" shadow="never">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="font-medium text-gray-700">{{ $t('email') }}</label>
                        <div class="mt-1 text-gray-900">
                            <a :href="'mailto:' + authStore.profile?.email">{{ authStore.profile?.email }}</a>
                        </div>
                    </div>
                    <!-- <div>
                        <label class="font-medium text-gray-700">{{ $t('phone') }}</label>
                        <br>
                        <div class="mt-1 text-gray-900">
                            <a v-if="authStore.profile?.phone" :href="'tel:' + authStore.profile?.phone">{{ authStore.profile?.phone }}</a>
                            <span v-else>-</span>
                        </div>
                    </div> -->
                </div>
            </el-card>
            <div class="max-w-full! flex justify-between items-center">
                <el-button @click="changePasswordDialogRef?.open()" text class="max-w-auto!">
                    {{ $t("changePassword") }}
                </el-button>
                <ChangePasswordDialogApp ref="changePasswordDialogRef" />
                <div class="min-w-fit">
                    <el-button @click="dialogModel = false">
                        {{ $t("close") }}
                    </el-button>
                    <el-button type="primary" @click="showUpdateProfileForm">
                        {{ $t("edit") }}
                    </el-button>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import AuthStore from '@/modules/auth/store';
import AuthApi from '@/modules/auth/api';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useI18n } from 'vue-i18n';
import type { ProfileUpdateBody } from '@/modules/auth/type';
import ChangePasswordDialogApp from '@/layouts/header/components/dialogs/changePassword.vue';

const { t } = useI18n();

const authStore = AuthStore();
const authApi = new AuthApi();

const loadingContainer = ref<('submitUpdateProfile')[]>([]);

const changePasswordDialogRef = ref<InstanceType<typeof ChangePasswordDialogApp>>();

const isEdit = ref(false);
const dialogModel = ref(false);

const updateProfileFormData = ref<ProfileUpdateBody>();

const updateProfileFormRef = ref<FormInstance>();

const updateProfileFormRules = reactive<FormRules>({
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ],
  email: [
    { required: true, message: t('required'), trigger: 'submit' },
    { type: 'email', message: t('invalid'), trigger: 'submit' },
  ]
});

const showUpdateProfileForm = () => {
  isEdit.value = true;
  updateProfileFormData.value = authStore.profile;
};

const resetUpdateProfileForm = (formEl: FormInstance | undefined = updateProfileFormRef.value) => {
  if (!formEl) return;
  formEl.resetFields();
};

const hideUpdateProfileForm = (formEl: FormInstance | undefined = updateProfileFormRef.value) => {
  resetUpdateProfileForm(formEl);
  isEdit.value = false;
};

const submitUpdateProfile = async (formEl: FormInstance | undefined = updateProfileFormRef.value) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      try {
        loadingContainer.value.push("submitUpdateProfile");
        const response = await authApi.updateProfile(updateProfileFormData.value!);
        authStore.set(response.detail);
        ElMessage.success(t('profileUpdatedSuccessfully'));
        hideUpdateProfileForm(formEl);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t("failedToUpdateProfile");
        ElMessage.error(errorMessage);
      } finally {
        loadingContainer.value = loadingContainer.value.filter(item => item !== "submitUpdateProfile");
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