<template>
  <el-dialog v-model="dialogModel" :title="$t('createSession')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <el-form ref="formRef" v-loading="loadingContainer.includes('submit')" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
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
          <el-button type="primary" :disabled="!$hasPermission('sessions.create')" @click="submit()">
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
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { SessionCreateBody } from '@/modules/sessions/type';
import sessionsApi from '@/modules/sessions/api';
import confirmDialog from '@/services/dialog/confirm';
import { ensurePermission } from '@/services/permission';

const { t } = useI18n();
const router = useRouter();

const loadingContainer = ref<('submit')[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const disabledDate = (date: Date) => date.getTime() < new Date(new Date().toDateString()).getTime();

const formRules = reactive<Record<keyof SessionCreateBody, FormItemRule | FormItemRule[]>>({
  date: [{ required: true, message: t('required'), trigger: 'submit' }],
  note: [{ max: 255, message: t('lengthShouldBe3To100'), trigger: 'submit' }]
});

const formData = ref<SessionCreateBody>({
  date: '',
  note: ''
});

const reset = (formEl: FormInstance | undefined = formRef.value) => {
  formData.value = { date: '', note: '' };
  formEl?.resetFields();
};

const close = (formEl: FormInstance | undefined = formRef.value) => {
  reset(formEl);
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
      message: 'areYouSureYouWantToCreateThisSession?', title: 'createSession',
      confirmButtonText: 'create', confirmButtonType: 'primary', cancelButtonText: 'cancel', type: 'info'
    });
    try {
      loadingContainer.value.push('submit');
      const response = await sessionsApi.create(formData.value);
      ElMessage.success(t('sessionCreatedSuccessfully'));
      dialogModel.value = false;
      reset();
      router.push({ name: 'sessions-detail', params: { uid: response.detail.uid } });
    } catch (error: any) {
      const msg = error?.detail?.message;
      ElMessage.error(msg ? t(msg) : t('failedToCreateSession'));
    } finally {
      loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
    }
  });
};

const open = (date?: string) => {
  if (!ensurePermission('sessions.create')) return;
  dialogModel.value = true;
  if (date) formData.value.date = date;
};

defineExpose({ open });
</script>
