<template>
  <el-dialog v-model="dialogModel" :title="$t('createEmployee')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <!-- <el-scrollbar> -->
      <el-form ref="formRef" v-loading="loadingContainer.length" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">        
        <el-form-item :label="$t('name')" prop="name" class="mb-0!">
          <el-input v-model="formData.name" :placeholder="$t('name')" />
        </el-form-item>
        
        <el-form-item :label="$t('status')" prop="status" class="mb-0!">
          <el-select v-model="formData.status" :placeholder="$t('status')" class="w-full">
            <el-option v-for="({ label, id }) in status" :key="id" :label="$t(label)" :value="id" />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="$t('team')" prop="team_uid" class="mb-0!">
          <el-select v-model="formData.team_uid" :options="$formatter.selectOptions(teams)" :placeholder="$t('team')" class="w-full" />
        </el-form-item>

        <el-form-item :label="$t('vacationStartAt')" prop="vacation_start_at" class="mb-0!">
          <el-date-picker v-model="formData.vacation_start_at" type="date" :placeholder="$t('vacationStartAt')" class="w-full!" />
        </el-form-item>
      </el-form>
      <div class="flex justify-end gap-2 mb-0! mt-8">
        <el-button @click="close()">
          {{ $t("close") }}
        </el-button>
        <el-button type="primary" @click="submit()">
          {{ $t("create") }}
        </el-button>
      </div>
    <!-- </el-scrollbar> -->
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus'
import type { EmployeeCreateBody } from '@/modules/employees/type';
import { useI18n } from 'vue-i18n';
import EmployeeApi from '@/modules/employees/api';
import TeamApi from '@/modules/teams/api';
import { status } from '@/modules/employees/constant';
import type { Team } from '@/modules/teams/type';
import confirmDialog from '@/services/dialog/confirm';

const emit = defineEmits(['submitted']);

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const teams = ref<Team[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof EmployeeCreateBody, FormItemRule | FormItemRule[]>>({
  name: { required: true, message: t('required'), trigger: 'submit' },
  status: { required: true, message: t('required'), trigger: 'submit' },
  team_uid: { type: 'string', message: t('required'), trigger: 'submit' },
  vacation_start_at: { type: 'string', message: t('required'), trigger: 'submit' },
});

const formData = ref<EmployeeCreateBody>({
  name: '',
  status: 0,
  team_uid: '',
  vacation_start_at: ''
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
        await EmployeeApi.create(formData.value);
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