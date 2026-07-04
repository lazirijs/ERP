<template>
  <el-dialog v-model="dialogModel" :title="$t('editClient')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !$arrayHasAny(loadingContainer, ['loading', 'submit']) && done()">
    <el-form ref="formRef" v-loading="$arrayHasAny(loadingContainer, ['loading', 'submit'])" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full">
      <el-form-item :label="$t('name')" prop="name">
        <el-input v-model="formData.name" :placeholder="$t('client')" />
      </el-form-item>
      <el-form-item :label="$t('team')" prop="team_uid">
        <el-select v-model="formData.team_uid" :placeholder="$t('selectTeam')" filterable>
          <el-option v-for="team in teams" :key="team.uid" :label="team.name" :value="team.uid" :disabled="team.uid === formData.team_uid" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('vacationStartAt')" prop="vacation_start_at" class="mb-0!">
        <el-date-picker v-model="formData.vacation_start_at" type="date" :placeholder="$t('vacationStartAt')" class="w-full!" />
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
import type { EmployeeUpdateBody } from '@/modules/employees/type';
import { useI18n } from 'vue-i18n';
import teamsApi from '@/modules/teams/api';
import employeesApi from '@/modules/employees/api';
import type { Team } from '@/modules/teams/type';
import confirmDialog from '@/services/dialog/confirm';

const props = defineProps<{
  uid: string;
}>();

const emit = defineEmits(['submitted']);

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const teams = ref<Team[]>([]);

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
  ],
  vacation_start_at: [
    { type: 'string', message: t('required'), trigger: 'submit' },
  ],
});

const formData = ref<EmployeeUpdateBody>({ 
  uid: props.uid,
  name: '',
  team_uid: '',
  status: 0,
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
        formData.value.team_uid = employeeResponse.detail.team_uid || '';
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