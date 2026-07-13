<template>
  <el-dialog v-model="dialogModel" :title="$t('editClient')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !$arrayHasAny(loadingContainer, ['loading', 'submit']) && done()">
    <el-form ref="formRef" v-loading="$arrayHasAny(loadingContainer, ['loading', 'submit'])" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full">
      <el-form-item :label="$t('name')" prop="name">
        <el-input v-model="formData.name" :placeholder="$t('client')" />
      </el-form-item>
      <el-form-item :label="$t('supervisor')" prop="supervisor_uid">
        <el-select v-model="formData.supervisor_uid" :placeholder="$t('selectSupervisor')" filterable>
          <el-option v-for="employee in employees" :key="employee.uid" :label="employee.name" :value="employee.uid" :disabled="employee.uid === formData.supervisor_uid" />
        </el-select>
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
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus'
import type { TeamUpdateBody } from '@/modules/teams/type';
import teamsApi from '@/modules/teams/api';
import employeesApi from '@/modules/employees/api';
import type { Employee } from '@/modules/employees/type';
import confirmDialog from '@/services/dialog/confirm';

const props = defineProps<{
  uid: string;
}>();

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const employees = ref<Employee[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof TeamUpdateBody, FormItemRule | FormItemRule[]>>({
  uid: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ],
  supervisor_uid: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
});

const formData = ref<TeamUpdateBody>({ 
  uid: props.uid,
  name: '',
  supervisor_uid: ''
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
        message: 'areYouSureYouWantToUpdateThisTeam?',
        title: 'updateTeam',
        confirmButtonText: 'update',
        confirmButtonType: 'primary',
        cancelButtonText: 'cancel',
        type: 'info',
      })
      try {
        loadingContainer.value.push('submit');
        await teamsApi.update(formData.value);
        ElMessage.success(t('teamUpdatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToUpdateTeam');
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
    const [ teamResponse, employeesResponse ] = await Promise.all([
      teamsApi.get(props.uid),
      employeesApi.getAll({ filters: [{ field: "team.name", values: [props.uid], operation: "=" }]})
    ]) 
    if(teamResponse.success) {
      formData.value.name = teamResponse.detail.name;
      formData.value.uid = teamResponse.detail.uid;
      formData.value.supervisor_uid = teamResponse.detail.supervisor.uid;
    }
    if(employeesResponse.success) employees.value = employeesResponse.detail.data;
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