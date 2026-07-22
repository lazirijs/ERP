<template>
  <el-dialog v-model="dialogModel" :title="$t('addItems')" align-center class="min-w-11/12 md:min-w-4/5!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <div class="flex justify-end mb-6">
      <el-button type="primary" @click="batchGridRef?.addRow()">
        <el-icon class="mr-2">
          <el-icon-plus />
        </el-icon>
        {{ $t('addItem') }}
      </el-button>
    </div>
    <items-batch-data-grid-app v-if="dialogModel" v-loading="loadingContainer.includes('submit')" ref="batchGridRef" :show-supplier="false" />
    <div class="flex justify-end gap-2 mb-0! mt-8">
      <el-button @click="close()">
        {{ $t("close") }}
      </el-button>
      <el-button type="primary" :disabled="!$hasPermission('purchases.update')" @click="submit()">
        {{ $t("add") }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import itemsApi from '../../api';
import ItemsBatchDataGridApp from '@/modules/purchases/components/items-batch-data-grid.vue';
import confirmDialog from '@/services/dialog/confirm';
import { ensurePermission } from '@/services/permission';

const props = defineProps<{
  purchase_uid: string;
}>();

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<('submit')[]>([]);
const dialogModel = ref<boolean>(false);
const batchGridRef = ref<InstanceType<typeof ItemsBatchDataGridApp>>();

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
  if (!rows.length) return ElMessage.error(t('addAtLeastOneRow'));
  await confirmDialog({
    message: 'areYouSureYouWantToAddTheseItems?', title: 'addItems',
    confirmButtonText: 'add', confirmButtonType: 'primary', cancelButtonText: 'cancel', type: 'info'
  });
  try {
    loadingContainer.value.push('submit');
    await itemsApi.createBatch(props.purchase_uid, rows);
    ElMessage.success(t('itemsAddedSuccessfully'));
    close(true);
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('failedToAddItems'));
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
  }
};

const open = () => {
  if (!ensurePermission('purchases.update')) return;
  dialogModel.value = true;
};

defineExpose({ open });
</script>
