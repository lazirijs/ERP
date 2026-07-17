<template>
  <el-dialog v-model="dialogModel" :title="$t('createUser')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <el-form ref="formRef" v-loading="loadingContainer.includes('submit')" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full">
      <!-- <div class="size-26 mx-auto my-6 overflow-hidden rounded-full bg-gray-100 border border-gray-200">
        <img :src="$previewImage({ type: 'avatar' })" class="object-cover size-full" />
      </div> -->
      <el-form-item :label="$t('name')" prop="name">
          <el-input v-model="formData.name" :placeholder="$t('user')" />
      </el-form-item>
      <el-form-item :label="$t('email')" prop="email">
          <el-input v-model="formData.email" type="email" placeholder="user@mail.com" />
      </el-form-item>
      <el-form-item :label="$t('status')" prop="status">
          <el-select v-model="formData.status" class="w-full">
              <template #label="{ value }">
                  <span :class="`badge-app-${ status[value as 0 | 1 | 2].color } p-1!`">{{ $t(status[value as 0 | 1 | 2].label) }}</span>
              </template>
              <el-option v-for="s in status" :key="s.id" :label="$t(s.label)" :value="s.id">
                  <span :class="`badge-app-${ s.color }`">{{ $t(s.label) }}</span>
              </el-option>
          </el-select>
      </el-form-item>
      <el-form-item :label="$t('role')" prop="role_uid">
          <el-select v-model="formData.role_uid" clearable filterable :disabled="formData.is_admin" :placeholder="$t('selectRole')" class="w-full">
              <el-option v-for="role in roles" :key="role.uid" :label="role.name" :value="role.uid" />
          </el-select>
      </el-form-item>
      <el-form-item :label="$t('administrator')" prop="is_admin">
          <div class="flex items-center gap-2">
              <el-switch v-model="formData.is_admin" @change="onAdminChange" />
              <span class="text-xs text-gray-400">{{ $t('adminBypassesPermissions') }}</span>
          </div>
      </el-form-item>
      <el-form-item class="mb-0! mt-8">
          <div class="ml-auto">
              <el-button @click="close()">
                  {{ $t("close") }}
              </el-button>
              <el-button type="primary" @click="submit()">
                  {{ $t("create") }}
              </el-button>
          </div>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus'
import type { UserCreateBody } from '@/modules/users/type';
import type { Role } from '@/modules/roles/type';
import { status } from '@/modules/users/constant';
import { useI18n } from 'vue-i18n';
import userApi from '@/modules/users/api';
import RoleApi from '@/modules/roles/api';

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<('submit')[]>([])

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const roles = ref<Role[]>([]);

// An admin bypasses all permission checks, so a role is redundant — clear it.
const onAdminChange = (isAdmin: string | number | boolean) => {
  if (isAdmin) formData.value.role_uid = null;
};

const formRules = reactive<Partial<Record<keyof UserCreateBody, FormItemRule | FormItemRule[]>>>({
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ],
  email: [
    { required: true, message: t('required'), trigger: 'submit' },
    { type: 'email', message: t('invalid'), trigger: 'submit' },
  ],
  // password: [
  //   { required: true, message: t('required'), trigger: 'submit' },
  //   { min: 6, message: t('passwordTooShort'), trigger: 'submit' },
  // ],
});

const formData = ref<UserCreateBody>({
  name: '',
  email: '',
  role_uid: null,
  is_admin: false,
  status: 1,
});

const reset = (formEl: FormInstance | undefined = formRef.value) => {
  if (!formEl) return;
  formEl.resetFields();
};

const close = (formEl: FormInstance | undefined = formRef.value, triggerSubmitted: boolean = false) => {
  reset(formEl);
  if (triggerSubmitted) emit('submitted');
  dialogModel.value = false;
};

const submit = async (formEl: FormInstance | undefined = formRef.value) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      try {
        loadingContainer.value.push('submit');
        await userApi.create(formData.value);
        ElMessage.success(t('userCreatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t("failedToCreateUser");
        ElMessage.error(errorMessage);
      } finally {
        loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
      }
    } else {
      const firstError = Object.values(fields!)[0][0];
      ElMessage.error(`${t(firstError.field!)}: ${firstError.message}`);
    }
  })
};

const open = async () => {
  dialogModel.value = true;
  try {
    const response = await RoleApi.getAll({ take: 100 });
    roles.value = response.detail.data;
  } catch {
    roles.value = [];
  }
};

defineExpose({ open });
</script>