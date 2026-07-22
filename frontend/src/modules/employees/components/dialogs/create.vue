<template>
  <el-dialog v-model="dialogModel" :title="$t('createEmployee')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <!-- <el-scrollbar> -->
      <el-form ref="formRef" v-loading="loadingContainer.length" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
        <el-form-item class="mb-0! relative">
          <el-upload class="mx-auto relative" :auto-upload="false" :show-file-list="false" accept="image/*" @change="onImageChange">
            <el-button v-if="preview" text type="danger" class="absolute -top-1 -right-1" size="small" circle @click.stop="removeImagePreview">
              <el-icon :size="15"><el-icon-close /></el-icon>
            </el-button>
            <div class="absolute size-40 hover:bg-black/10 transition-colors duration-300 rounded-full" />
            <div class="size-40 overflow-hidden rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer">              
              <img :src="preview || previewImage({ type: 'avatar' })" class="object-cover size-full" />
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item :label="$t('name')" prop="name" class="mb-0!">
          <el-input v-model="formData.name" :placeholder="$t('name')" />
        </el-form-item>

        <el-form-item :label="$t('team')" prop="team_uid" class="mb-0!">
          <el-select v-model="formData.team_uid" :options="$formatter.selectOptions(teams)" :placeholder="$t('team')" class="w-full" />
        </el-form-item>
        
        <el-form-item :label="$t('status')" prop="status" class="mb-0!">
          <el-select v-model="formData.status" :placeholder="$t('status')" class="w-full el-select-on-focus-no-outline">
            <template #label="{ label, value }">
              <span :class="`badge-app-${status[value as 0 | 1 | 2 | 3].color} p-1!`">
                {{ $t(label) }}
              </span>
            </template>
            <el-option v-for="({ id, label, color }) in status" :key="id" :label="$t(label)" :value="id">
              <span :class="`badge-app-${color}`">
                {{ $t(label) }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        
      </el-form>
      <div class="flex justify-end gap-2 mb-0! mt-8">
        <el-button @click="close()">
          {{ $t("close") }}
        </el-button>
        <el-button type="primary" :disabled="!$hasPermission('employees.create')" @click="submit()">
          {{ $t("create") }}
        </el-button>
      </div>
    <!-- </el-scrollbar> -->
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule, UploadFile } from 'element-plus'
import type { EmployeeCreateBody } from '@/modules/employees/type';
import { useI18n } from 'vue-i18n';
import EmployeeApi from '@/modules/employees/api';
import TeamApi from '@/modules/teams/api';
import { status } from '@/modules/employees/constant';
import type { Team } from '@/modules/teams/type';
import confirmDialog from '@/services/dialog/confirm';
import { previewImage } from '@/services/files';
import { ensurePermission } from '@/services/permission';

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const teams = ref<Team[]>([]);

const image = ref<File | null>(null);
const preview = ref<string>('');

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof EmployeeCreateBody, FormItemRule | FormItemRule[]>>({
  name: { required: true, message: t('required'), trigger: 'submit' },
  status: { required: true, message: t('required'), trigger: 'submit' },
  team_uid: { type: 'string', message: t('required'), trigger: 'submit' }
});

const formData = ref<EmployeeCreateBody>({
  name: '',
  status: 0,
  team_uid: ''
});

const removeImagePreview = () => {
  image.value = null;
  preview.value = '';
};

const onImageChange = (uploadFile: UploadFile) => {
  image.value = uploadFile.raw ?? null;
  preview.value = uploadFile.raw ? URL.createObjectURL(uploadFile.raw) : '';
};

const reset = (formEl: FormInstance | undefined = formRef.value) => {
  image.value = null;
  preview.value = '';
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
      await confirmDialog({
        message: 'areYouSureYouWantToCreateThisEmployee?',
        title: 'createEmployee',
        confirmButtonText: 'create',
        confirmButtonType: 'primary',
        cancelButtonText: t('cancel'),
        type: 'info'
      })
      try {
        loadingContainer.value.push('submit');
        const response = await EmployeeApi.create(formData.value);
        if (image.value) await EmployeeApi.uploadDocument(response.detail.uid, image.value, true);
        ElMessage.success(t('employeeCreatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToCreateEmployee');
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
  if (!ensurePermission('employees.create')) return;
  dialogModel.value = true;
  try {
    loadingContainer.value.push('loading');
    const response = await TeamApi.getAll();
    if (response.success) teams.value = response.detail.data;
  } catch (error: any) {
    const errorMessage = error?.detail?.message || t('loadingFailed');
    ElMessage.error(errorMessage);
    dialogModel.value = false;
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'loading');
  }
};

defineExpose({
  open
  // close: () => close()
});
</script>