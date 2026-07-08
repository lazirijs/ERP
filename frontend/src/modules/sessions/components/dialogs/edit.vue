<template>
  <el-dialog v-model="dialogModel" :title="$t('editSession')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.length && done()">
    <el-form ref="formRef" v-loading="loadingContainer.length" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item :label="$t('attendanceDate')" prop="date" class="mb-0!">
        <el-date-picker v-model="formData.date" type="date" value-format="YYYY-MM-DD" :disabled-date="disabledDate" :clearable="false" :placeholder="$t('attendanceDate')" class="min-w-full" />
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
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus'
import { useI18n } from 'vue-i18n';
import type { SessionUpdateBody } from '../../type';
import sessionsApi from '../../api';
import confirmDialog from '@/services/dialog/confirm';

const props = defineProps<{
  uid: string;
}>();

const emit = defineEmits(['submitted']);

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const disabledDate = (date: Date) => date.getTime() < new Date(new Date().toDateString()).getTime();

const formRules = reactive<Record<keyof SessionUpdateBody, FormItemRule | FormItemRule[]>>({
  uid: [{ required: true, message: t('required'), trigger: 'submit' }],
  date: [{ required: true, message: t('required'), trigger: 'submit' }],
  note: [{ max: 255, message: t('lengthShouldBe3To100'), trigger: 'submit' }]
});

const formData = ref<SessionUpdateBody>({
  uid: props.uid,
  date: '',
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

const submit = async (formEl: FormInstance | undefined = formRef.value) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (!valid) {
      const firstError = Object.values(fields!)[0][0];
      ElMessage.error(`${t(firstError.field!)}: ${firstError.message}`);
      return;
    }
    await confirmDialog({
      message: 'areYouSureYouWantToUpdateThisSession?', title: 'updateSession',
      confirmButtonText: 'update', confirmButtonType: 'primary', cancelButtonText: 'cancel', type: 'info'
    });
    try {
      loadingContainer.value.push('submit');
      await sessionsApi.update({ ...formData.value, note: formData.value.note || undefined });
      ElMessage.success(t('sessionUpdatedSuccessfully'));
      close(formEl, true);
    } catch (error: any) {
      const msg = error?.detail?.message;
      ElMessage.error(msg ? t(msg) : t('failedToUpdateSession'));
    } finally {
      loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
    }
  });
};

const open = async () => {
  dialogModel.value = true;
  try {
    loadingContainer.value.push('loading');
    const response = await sessionsApi.get(props.uid);
    formData.value.uid = response.detail.uid;
    formData.value.date = response.detail.date;
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
