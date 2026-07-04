<template>
  <el-dialog v-model="dialogModel" :title="$t('createUser')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <el-form ref="formRef" v-loading="loadingContainer.includes('submit')" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full">
      <div class="size-26 mx-auto my-6 overflow-hidden rounded-full bg-gray-100 border border-gray-200">
        <img :src="$previewImage({ type: 'avatar' })" class="object-cover size-full" />
      </div>
      <el-form-item :label="$t('name')" prop="name">
          <el-input v-model="formData.name" :placeholder="$t('user')" />
      </el-form-item>
      <el-form-item :label="$t('email')" prop="email">
          <el-input v-model="formData.email" type="email" placeholder="user@mail.com" />
      </el-form-item>
      <!-- <el-form-item :label="$t('phone')" prop="phone">
          <el-input v-model="formData.phone" placeholder="0555555555" />
      </el-form-item> -->
      <el-form-item class="mb-0! mt-8">
          <el-button @click="reset()" text>
              {{ $t("reset") }}
          </el-button>
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
import { useI18n } from 'vue-i18n';
import userApi from '@/modules/users/api';

const emit = defineEmits(['submitted']);

const { t } = useI18n();

const loadingContainer = ref<('submit')[]>([])

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof UserCreateBody, FormItemRule | FormItemRule[]>>({
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
  // phone: '',
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

defineExpose({
  open: () => dialogModel.value = true,
  // close: () => close()
});
</script>