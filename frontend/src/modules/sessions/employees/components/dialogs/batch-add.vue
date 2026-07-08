<template>
  <el-dialog v-model="dialogModel" :title="$t('addEmployees')" align-center class="min-w-11/12 md:min-w-4/5!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <div class="flex justify-end mb-6">
      <el-button type="primary" @click="batchGridRef?.addRow()">
        <el-icon class="mr-2">
          <el-icon-plus />
        </el-icon>
        {{ $t('add') }}
      </el-button>
    </div>
    <session-employees-batch-data-grid-app v-if="dialogModel" v-loading="loadingContainer.includes('submit')" ref="batchGridRef" :allow-present="allowPresent" />
    <div class="flex justify-end gap-2 mb-0! mt-8">
      <el-button @click="close()">
        {{ $t("close") }}
      </el-button>
      <el-button type="primary" @click="submit()">
        {{ $t("add") }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import sessionEmployeesApi from '../../api';
import SessionEmployeesBatchDataGridApp from '../session-employees-batch-data-grid.vue';
import confirmDialog from '@/services/dialog/confirm';

const props = defineProps<{
  session_uid: string;
  allowPresent?: boolean;
}>();

const emit = defineEmits(['submitted']);

const { t } = useI18n();

const loadingContainer = ref<('submit')[]>([]);
const dialogModel = ref<boolean>(false);
const batchGridRef = ref<InstanceType<typeof SessionEmployeesBatchDataGridApp>>();

const reset = () => {
  batchGridRef.value?.reset();
};

const close = (triggerSubmitted: boolean = false) => {
  reset();
  if (triggerSubmitted) emit('submitted');
  dialogModel.value = false;
};

const submit = async () => {
  let rows: any[];
  try {
    rows = await batchGridRef.value!.getRows();
  } catch {
    return ElMessage.error(t('pleaseFixInvalidRows'));
  }
  if (!rows.length) return ElMessage.error(t('addAtLeastOneEmployee'));
  await confirmDialog({
    message: 'areYouSureYouWantToAddTheseEmployees?', title: 'addEmployees',
    confirmButtonText: 'add', confirmButtonType: 'primary', cancelButtonText: 'cancel', type: 'info'
  });
  try {
    loadingContainer.value.push('submit');
    await sessionEmployeesApi.createBatch(props.session_uid, rows);
    ElMessage.success(t('employeesAddedSuccessfully'));
    close(true);
  } catch (error: any) {
    const msg = error?.detail?.message;
    ElMessage.error(msg ? t(msg) : t('failedToAddEmployees'));
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
  }
};

const open = () => {
  dialogModel.value = true;
};

defineExpose({ open });
</script>
