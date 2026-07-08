<template>
  <el-dialog v-model="dialogModel" :title="$t('edit')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.length && done()">
    <el-form ref="formRef" v-loading="loadingContainer.length" :model="formData" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item :label="$t('employee')" class="mb-0!">
        <el-input :model-value="employeeName" disabled />
      </el-form-item>
      <el-form-item :label="$t('status')" prop="status" class="mb-0!">
        <el-select v-model="formData.status" :placeholder="$t('status')" class="w-full el-select-on-focus-no-outline">
          <template #label="{ label, value }">
            <span :class="`badge-app-${status[value as 0 | 1].color} p-1!`">
              {{ $t(label) }}
            </span>
          </template>
          <el-option v-for="({ id, label, color }) in status" :key="id" :label="$t(label)" :value="id" :disabled="id === 0 && !props.allowPresent">
            <span :class="`badge-app-${color}`">
              {{ $t(label) }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('note')" prop="note" class="mb-0!">
        <el-input v-model="formData.note" type="textarea" :rows="2" :placeholder="$t('note')" />
      </el-form-item>

      <el-form-item class="mb-0! mt-8">
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
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n';
import sessionEmployeesApi from '../../api';
import { status } from '../../../constant';
import type { SessionEmployeeUpdateBody } from '../../type';
import confirmDialog from '@/services/dialog/confirm';

const props = defineProps<{
  uid: string;
  allowPresent?: boolean;
}>();

const emit = defineEmits(['submitted']);

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);
const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const employeeName = ref('');

const formData = ref<SessionEmployeeUpdateBody>({
  uid: props.uid,
  status: 1,
  note: ''
});

const reset = (formEl: FormInstance | undefined = formRef.value) => {
  formEl?.resetFields();
};

const close = (formEl: FormInstance | undefined = formRef.value, triggerSubmitted: boolean = false) => {
  reset(formEl);
  if (triggerSubmitted) emit('submitted');
  dialogModel.value = false;
};

const submit = async () => {
  await confirmDialog({
    message: 'areYouSureYouWantToUpdateThisRecord?', title: 'edit',
    confirmButtonText: 'update', confirmButtonType: 'primary', cancelButtonText: 'cancel', type: 'info'
  });
  try {
    loadingContainer.value.push('submit');
    await sessionEmployeesApi.update({ ...formData.value, note: formData.value.note || undefined });
    ElMessage.success(t('updatedSuccessfully'));
    close(formRef.value, true);
  } catch (error: any) {
    const msg = error?.detail?.message;
    ElMessage.error(msg ? t(msg) : t('loadingFailed'));
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
  }
};

const open = async (uid: string) => {
  loadingContainer.value.push('loading');
  dialogModel.value = true;
  formData.value.uid = uid;
  try {
    const response = await sessionEmployeesApi.get(uid);
    employeeName.value = response.detail.employee?.name ?? '';
    formData.value.uid = response.detail.uid;
    formData.value.status = response.detail.status;
    formData.value.note = response.detail.note ?? '';
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('loadingFailed'));
    dialogModel.value = false;
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'loading');
  }
};

defineExpose({ open });
</script>
