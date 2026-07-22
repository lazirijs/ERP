<template>
  <container-app type="fixed">
    <div class="md:h-screen w-full flex flex-col items-center justify-center md:max-w-1/4! mx-auto">
      <p class="w-full bg-white border border-gray-200 text-gray-500 text-xs text-center p-2 m-2 rounded" v-html="$t('loginDevelopmentNote')" />
      <el-form v-loading="loading" ref="ruleFormRef" class="w-full bg-white space-y-8 p-4 border border-gray-200 rounded-lg" label-position="top" :model="formData" :rules="rulesAddUser" @submit.prevent="login()">
        <div class="relative group size-24 mt-4 mx-auto rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
          <el-icon size="2rem">
            <el-icon-lock />
          </el-icon>
        </div>
        <p class="text-gray-500 text-xs text-center mb-4">
          {{ $t("loginCredentialsFilled") }}
        </p>
        <div>
          <el-form-item :label="$t('email')" prop="email">
            <el-input v-model="formData.email" type="email" placeholder="user@mail.com" />
          </el-form-item>
          <el-form-item :label="$t('password')" prop="password">
            <el-input v-model="formData.password" type="password" :show-password="true" placeholder="********" />
          </el-form-item>
        </div>
        <el-button type="primary" @click="login()" class="w-full mb-0!">
          {{ $t("login") }}
        </el-button>
      </el-form>
    </div>
  </container-app>
</template>


<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus'
import type { LoginBody } from '@/modules/auth/type';
import { useI18n } from 'vue-i18n';
import AuthApi from '@/modules/auth/api';
import AuthStore from '@/modules/auth/store';

const { t } = useI18n();
const authApi = new AuthApi();
const authStore = AuthStore();

const loading = ref<boolean>(false);
const ruleFormRef = ref<FormInstance>();

const rulesAddUser = reactive<FormRules<LoginBody>>({
  email: [
    { required: true, message: t('required'), trigger: 'submit' },
    { type: 'email', message: t('invalid'), trigger: 'submit' },
  ],
  password: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 6, message: t('minLength6'), trigger: 'submit' },
  ]
});

const formData = ref<LoginBody>({
  email: 'user@mail.com',
  password: '123456',
});

const login = async (formEl: FormInstance | undefined = ruleFormRef.value) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      try {
        loading.value = true;
        const result = await authApi.login(formData.value);
        if (result.success) {
          const profile = await authApi.profile();
          authStore.login(profile.detail);
          ElMessage.success(t('userLoggedSuccessfully'));
        }
      } catch (error: any) {
        console.log({ error });
        const errorMessage = error?.detail?.message || t("failedToLogin");
        ElMessage.error(errorMessage);
      } finally {
        loading.value = false;
      }
    } else {
      const firstError = Object.values(fields!)[0][0];
      ElMessage.error(`${t(firstError.field!)}: ${firstError.message}`);
    }
  })
};
</script>