<template>
  <el-dialog v-model="dialogModel" :title="$t('editPurchase')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !$arrayHasAny(loadingContainer, ['loading', 'submit']) && done()">
    <el-form ref="formRef" v-loading="$arrayHasAny(loadingContainer, ['loading', 'submit'])" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item :label="$t('name')" prop="name" class="mb-0!">
        <el-input v-model="formData.name" :placeholder="$t('name')" />
      </el-form-item>
      <el-form-item :label="$t('supplier')" prop="supplier_uid" class="mb-0!">
        <el-select v-model="formData.supplier_uid" clearable filterable :placeholder="$t('supplier')" class="w-full">
          <el-option v-for="supplier in suppliers" :key="supplier.uid" :label="supplier.name" :value="supplier.uid" />
        </el-select>
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
import type { PurchaseUpdateBody } from '@/modules/purchases/type';
import { useI18n } from 'vue-i18n';
import PurchaseApi from '../../api';
import SupplierApi from '@/modules/suppliers/api';
import type { Supplier } from '@/modules/suppliers/type';
import confirmDialog from '@/services/dialog/confirm';

const props = defineProps<{
  purchase_uid: string;
}>();

const emit = defineEmits(['submitted']);

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const suppliers = ref<Supplier[]>([]);

const formRules = reactive<Record<keyof PurchaseUpdateBody, FormItemRule | FormItemRule[]>>({
  uid: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ],
  supplier_uid: [],
  note: [
    { max: 255, message: t('lengthShouldBe3To100'), trigger: 'submit' },
  ]
});

const formData = ref<PurchaseUpdateBody>({
  uid: props.purchase_uid,
  name: '',
  supplier_uid: null,
  note: ''
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
        message: 'areYouSureYouWantToUpdateThisPurchase?', title: 'updatePurchase',
        confirmButtonText: 'update', confirmButtonType: 'primary', cancelButtonText: 'cancel', type: 'info'
      });
      try {
        loadingContainer.value.push('submit');
        await PurchaseApi.update({ ...formData.value, note: formData.value.note || undefined });
        ElMessage.success(t('purchaseUpdatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        ElMessage.error(error?.detail?.message || t('failedToUpdatePurchase'));
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
    const [purchaseRes, suppliersRes] = await Promise.all([
      PurchaseApi.get(props.purchase_uid),
      SupplierApi.getAll()
    ]);
    suppliers.value = suppliersRes.detail.data;
    formData.value.uid = purchaseRes.detail.uid;
    formData.value.name = purchaseRes.detail.name;
    formData.value.supplier_uid = purchaseRes.detail.supplier_uid ?? null;
    formData.value.note = purchaseRes.detail.note ?? '';
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('loadingFailed'));
    dialogModel.value = false;
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'loading');
  }
};

defineExpose({ open });
</script>
