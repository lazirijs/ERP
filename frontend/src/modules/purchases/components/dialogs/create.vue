<template>
  <el-dialog v-model="dialogModel" :title="$t('create')" align-center :class="mode === 'items' ? 'min-w-11/12 md:min-w-4/5!' : 'min-w-11/12 md:min-w-1/4! md:max-w-1/4!'" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <div v-if="!props.supplier" class="flex justify-between items-center mb-6">
      <el-segmented v-model="mode" :options="modeOptions" :class="{ 'w-full': mode === 'purchase' }" />
      <el-button v-if="mode === 'items'" type="primary" @click="batchGridRef?.addRow()" class="ml-auto">
        <el-icon class="mr-2">
          <el-icon-plus />
        </el-icon>
        {{ $t('addItem') }}
      </el-button>
    </div>

    <!-- Single purchase -->
    <el-form v-if="mode === 'purchase'" ref="formRef" v-loading="loadingContainer.length" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item :label="$t('name')" prop="name" class="mb-0!">
        <el-input v-model="formData.name" :placeholder="$t('name')" />
      </el-form-item>
      <el-form-item :label="$t('supplier')" prop="supplier_uid" class="mb-0!">
        <el-select v-model="formData.supplier_uid" :disabled="!!props.supplier" clearable filterable :placeholder="$t('supplier')" class="w-full">
          <el-option v-for="supplier in suppliers" :key="supplier.uid" :label="supplier.name" :value="supplier.uid" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('note')" prop="note" class="mb-0!">
        <el-input v-model="formData.note" type="textarea" :placeholder="$t('note')" />
      </el-form-item>
    </el-form>

    <!-- Multiple purchases (batch: rows grouped by supplier) -->
    <items-batch-data-grid-app v-else v-loading="loadingContainer.includes('submit')" ref="batchGridRef" :show-supplier="true" />

    <div class="flex justify-end gap-2 mb-0! mt-8">
      <el-button @click="close()">
        {{ $t("close") }}
      </el-button>
      <el-button type="primary" @click="submit()">
        {{ $t("create") }}
      </el-button>
    </div>

  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus'
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { PurchaseCreateBody } from '@/modules/purchases/type';
import PurchaseApi from '@/modules/purchases/api';
import SupplierApi from '@/modules/suppliers/api';
import type { Supplier } from '@/modules/suppliers/type';
import ItemsBatchDataGridApp from '../items-batch-data-grid.vue';
import confirmDialog from '@/services/dialog/confirm';
import formatter from '@/services/formatter.ts';

const emit = defineEmits<{ submitted: [] }>();

const props = defineProps<{
  supplier?: Supplier;
  defaultMode?: 'purchase' | 'items';
}>();

const { t } = useI18n();
const router = useRouter();

const loadingContainer = ref<('submit' | 'loading')[]>([]);

const mode = ref<'purchase' | 'items'>(props.defaultMode || 'purchase');
const modeOptions = computed(() => [
  { label: t('purchase'), value: 'purchase' },
  { label: t('items'), value: 'items' }
]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);
const batchGridRef = ref<InstanceType<typeof ItemsBatchDataGridApp>>();

const suppliers = ref<Supplier[]>([]);

const formRules = reactive<Record<keyof PurchaseCreateBody, FormItemRule | FormItemRule[]>>({
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ],
  supplier_uid: [],
  note: { max: 255, message: t('lengthShouldBe3To100'), trigger: 'submit' },
});

const formData = ref<PurchaseCreateBody>({
  name: '',
  supplier_uid: null,
  note: ''
});

const reset = (formEl: FormInstance | undefined = formRef.value) => {
  formData.value = { name: '', supplier_uid: null, note: '' };
  batchGridRef.value?.reset();
  formEl?.resetFields();
};

const close = (formEl: FormInstance | undefined = formRef.value, triggerSubmitted: boolean = false) => {
  reset(formEl);
  if (triggerSubmitted) emit('submitted');
  dialogModel.value = false;
};

const submitSingle = async (formEl: FormInstance | undefined = formRef.value) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (!valid) {
      const firstError = Object.values(fields!)[0][0];
      ElMessage.error(`${t(firstError.field!)}: ${firstError.message}`);
      return;
    }
    await confirmDialog({
      message: 'areYouSureYouWantToCreateThisPurchase?', title: 'createPurchase',
      confirmButtonText: 'create', confirmButtonType: 'primary', cancelButtonText: 'cancel', type: 'info'
    });
    try {
      loadingContainer.value.push('submit');
      const response = await PurchaseApi.create(formData.value);
      ElMessage.success(t('purchaseCreatedSuccessfully'));
      dialogModel.value = false;
      reset();
      router.push({ name: 'purchases-detail', params: { uid: response.detail.uid } });
    } catch (error: any) {
      ElMessage.error(error?.detail?.message || t('failedToCreatePurchase'));
    } finally {
      loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
    }
  });
};

const submitMultiple = async () => {
  let rows: any[];
  try {
    rows = await batchGridRef.value!.getRows();
  } catch {
    return ElMessage.error(t('pleaseFixInvalidRows'));
  }
  if (!rows.length) return ElMessage.error(t('addAtLeastOneRow'));
  await confirmDialog({
    message: 'areYouSureYouWantToCreateThisPurchase?', title: 'createPurchase',
    confirmButtonText: 'create', confirmButtonType: 'primary', cancelButtonText: 'cancel', type: 'info'
  });
  try {
    loadingContainer.value.push('submit');
    await PurchaseApi.createBatch(rows);
    ElMessage.success(t('purchaseCreatedSuccessfully'));
    close(formRef.value, true);
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('failedToCreatePurchase'));
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
  }
};

const submit = () => mode.value === 'purchase' ? submitSingle() : submitMultiple();

const open = async () => {
  dialogModel.value = true;
  if (props.defaultMode) mode.value = props.defaultMode;
  formData.value.name = formatter.date(new Date().toISOString());
  try {
    if (props.supplier) {
      formData.value.supplier_uid = props.supplier.uid;
      suppliers.value = [props.supplier];
      } else {
      loadingContainer.value.push('loading');
      const res = await SupplierApi.getAll();
      suppliers.value = res.detail.data;
    }
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('loadingFailed'));
    dialogModel.value = false;
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'loading');
  }
};

defineExpose({ open });
</script>
