<template>
  <el-dialog v-model="dialogModel" :title="$t('createTeam')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <!-- <el-scrollbar> -->
      <el-form ref="formRef" v-loading="loadingContainer.length" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">        
        <el-form-item :label="$t('name')" prop="name" class="mb-0!">
          <el-input v-model="formData.name" :placeholder="$t('name')" />
        </el-form-item>

        <el-form-item :label="$t('supervisor')" prop="supervisor_uid" class="mb-0!">
          <el-select v-model="formData.supervisor_uid" :placeholder="$t('supervisor')" filterable>
            <el-option v-for="supervisor in employees" :key="supervisor.uid" :label="supervisor.name" :value="supervisor.uid" />
          </el-select>
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
import type { TeamCreateBody } from '@/modules/teams/type';
import { useI18n } from 'vue-i18n';
import TeamApi from '@/modules/teams/api';
import EmployeeApi from '@/modules/employees/api';
import type { Employee } from '@/modules/employees/type';
import confirmDialog from '@/services/dialog/confirm';

const emit = defineEmits(['submitted']);

const { t } = useI18n();

const loadingContainer = ref<( 'loading' | 'submit' )[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof TeamCreateBody, FormItemRule | FormItemRule[]>>({
  name: { required: true, message: t('required'), trigger: 'submit' },
  supervisor_uid: { required: true, message: t('required'), trigger: 'submit' },
});

const formData = ref<TeamCreateBody>({
  name: '',
  supervisor_uid: ''
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
    if (valid) {
      await confirmDialog({
        message: 'areYouSureYouWantToCreateThisTeam?',
        title: 'createTeam',
        confirmButtonText: 'create',
        confirmButtonType: 'primary',
        cancelButtonText: 'cancel',
        type: 'info',
      })
      try {
        loadingContainer.value.push('submit');
        await TeamApi.create(formData.value);
        ElMessage.success(t('teamCreatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToCreateTeam');
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
    const res = await Promise.all([
      EmployeeApi.getAll({ team_uid: null })
    ]);
    employees.value = res[0].detail.data;
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