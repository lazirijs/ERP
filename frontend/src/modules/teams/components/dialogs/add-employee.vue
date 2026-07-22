<template>
  <el-dialog v-model="dialogModel" :title="`${ $t('add') } ${ $t('employee') }`" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <el-form ref="formRef" v-loading="loadingContainer.length" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item :label="$t('employee')" prop="employee_uid" class="mb-0!">
        <el-select v-model="formData.employee_uid" :placeholder="$t('employee')" filterable>
          <el-option v-for="employee in employees" :key="employee.uid" :label="employee.name" :value="employee.uid" />
        </el-select>
      </el-form-item>
    </el-form>
    <div class="flex justify-end gap-2 mb-0! mt-8">
      <el-button @click="close()">
        {{ $t("close") }}
      </el-button>
      <el-button type="primary" :disabled="!$hasPermission('teams.update')" @click="submit()">
        {{ $t("add") }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus';
import { useI18n } from 'vue-i18n';
import EmployeeApi from '@/modules/employees/api';
import type { Employee } from '@/modules/employees/type';
import { ensurePermission } from '@/services/permission';

const props = defineProps<{ team_uid: string }>();

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formData = ref<{ employee_uid: string }>({
  employee_uid: ''
});

const formRules = reactive<Record<keyof typeof formData.value, FormItemRule | FormItemRule[]>>({
  employee_uid: { required: true, message: t('required'), trigger: 'submit' }
});

const employees = ref<Employee[]>([]);

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
    if (!valid) {
      const firstError = Object.values(fields!)[0][0];
      ElMessage.error(`${ t(firstError.field!) }: ${ firstError.message }`);
      return;
    }
    const employee = employees.value.find(item => item.uid === formData.value.employee_uid);
    if (!employee) return;
    try {
      loadingContainer.value.push('submit');
      await EmployeeApi.setTeam({ uid: employee.uid, team_uid: props.team_uid });
      ElMessage.success(t('employeeAddedSuccessfully'));
      close(formEl, true);
    } catch (error: any) {
      const errorMessage = error?.detail?.message || t('failedToAddEmployee');
      ElMessage.error(errorMessage);
    } finally {
      loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
    }
  });
};

const open = async () => {
  if (!ensurePermission('teams.update')) return;
  dialogModel.value = true;
  try {
    loadingContainer.value.push('loading');
    // Only employees that don't belong to any team yet (team_uid IS NULL).
    const response = await EmployeeApi.getAll({ filters: [{ field: 'team.name', operation: '=', values: [null] }] });
    employees.value = response.detail.data;
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
});
</script>
