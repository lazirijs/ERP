<template>
  <el-dialog v-model="dialogModel" :title="$t('editEmployee')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !$arrayHasAny(loadingContainer, ['loading', 'submit']) && done()">
    <el-form ref="formRef" v-loading="$arrayHasAny(loadingContainer, ['loading', 'submit'])" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item class="mb-0! relative">
        <el-upload class="mx-auto relative" :auto-upload="false" :show-file-list="false" accept="image/*" @change="onImageChange">
          <el-button v-if="preview && newImageSelected" text type="danger" class="absolute -top-1 -right-1" size="small" circle @click.stop="removeImagePreview">
            <el-icon :size="15"><el-icon-close /></el-icon>
          </el-button>
          <div class="absolute size-40 hover:bg-black/10 transition-colors duration-300 rounded-full" />
          <div class="size-40 overflow-hidden rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer">              
            <img :src="preview || previewImage({ type: 'avatar' })" class="object-cover size-full" />
          </div>
        </el-upload>
      </el-form-item>

      <el-form-item :label="$t('name')" prop="name" class="mb-0!">
        <el-input v-model="formData.name" :placeholder="$t('client')" />
      </el-form-item>

      <el-form-item :label="$t('team')" prop="team_uid" class="mb-0!">
        <el-select v-model="formData.team_uid" :placeholder="$t('selectTeam')" filterable>
          <el-option v-for="team in teams" :key="team.uid" :label="team.name" :value="team.uid" :disabled="team.uid === formData.team_uid" />
        </el-select>
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

      <el-form-item class="mb-0! mt-8">
        <div class="ml-auto">
          <el-button @click="close()">
            {{ $t("close") }}
          </el-button>
          <el-button type="primary" :disabled="!$hasPermission('employees.update')" @click="submit()">
            {{ $t("save") }}
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule, UploadFile } from 'element-plus'
import type { EmployeeUpdateBody } from '@/modules/employees/type';
import { useI18n } from 'vue-i18n';
import teamsApi from '@/modules/teams/api';
import employeesApi from '@/modules/employees/api';
import type { Team } from '@/modules/teams/type';
import confirmDialog from '@/services/dialog/confirm';
import { status } from '@/modules/employees/constant';
import { previewImage } from '@/services/files';
import { ensurePermission } from '@/services/permission';

const props = defineProps<{
  uid: string;
}>();

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const teams = ref<Team[]>([]);

const originalEmployeeImage = ref<string>();
const image = ref<File>();
const preview = ref<string>();
const newImageSelected = computed<boolean>(() => preview.value !== previewImage({ src: originalEmployeeImage.value }));

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof EmployeeUpdateBody, FormItemRule | FormItemRule[]>>({
  uid: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ],
  team_uid: [
    { type: 'string', message: t('required'), trigger: 'submit' },
  ],
  status: [
    { type: 'number', message: t('required'), trigger: 'submit' },
  ]
});

const formData = ref<EmployeeUpdateBody>({ 
  uid: props.uid,
  name: '',
  team_uid: '',
  status: 0
});

const onImageChange = (uploadFile?: UploadFile) => {
  image.value = uploadFile?.raw;
  preview.value = uploadFile?.raw ? URL.createObjectURL(uploadFile.raw) : '';
};

const removeImagePreview = () => {
  onImageChange();
  preview.value = originalEmployeeImage.value ? previewImage({ type: 'image', src: originalEmployeeImage.value }) : '';
};

const reset = (formEl: FormInstance | undefined = formRef.value) => {
  image.value = undefined;
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
        message: 'areYouSureYouWantToUpdateThisEmployee?',
        title: 'updateEmployee',
        confirmButtonText: 'update',
        confirmButtonType: 'primary',
        cancelButtonText: t('cancel'),
        type: 'info'
      })
      try {
        loadingContainer.value.push('submit');
        await employeesApi.update(formData.value);
        if (image.value) await employeesApi.uploadDocument(formData.value.uid, image.value, true);
        ElMessage.success(t('employeeUpdatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToUpdateEmployee');
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
  if (!ensurePermission('employees.update')) return;
  dialogModel.value = true;
  try {
    loadingContainer.value.push('loading');
    const [ employeeResponse, teamsResponse ] = await Promise.all([
        employeesApi.get(props.uid),
        teamsApi.getAll()
    ]) 
    if(employeeResponse.success) {
      formData.value.uid = employeeResponse.detail.uid;
      formData.value.name = employeeResponse.detail.name;
      formData.value.status = employeeResponse.detail.status;
      formData.value.team_uid = employeeResponse.detail.team_uid || '';
      originalEmployeeImage.value = employeeResponse.detail.image!;
      preview.value = employeeResponse.detail.image ? previewImage({ type: 'image', src: employeeResponse.detail.image }) : '';
    }
    if(teamsResponse.success) {
        teams.value = teamsResponse.detail.data;
    }
  } catch (error: any) {
    const errorMessage = error?.detail?.message || t('loadingFailed');
    ElMessage.error(errorMessage);
    dialogModel.value = false;
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'loading');
  }
};

defineExpose({
  open,
  // close: () => close()
});
</script>