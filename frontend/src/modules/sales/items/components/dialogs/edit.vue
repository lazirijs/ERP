<template>
  <el-dialog v-model="dialogModel" :title="$t('editItem')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !$arrayHasAny(loadingContainer, ['loading', 'submit']) && done()">
    <el-form ref="formRef" v-loading="$arrayHasAny(loadingContainer, ['loading', 'submit'])" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item :label="$t('product')" prop="product_uid" class="mb-0!">
        <el-select v-model="formData.product_uid" filterable :placeholder="$t('product')" class="w-full">
          <el-option v-for="product in products" :key="product.uid" :label="product.name" :value="product.uid" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('unitPrice')" prop="price" class="mb-0!">
        <currency-input-app v-model.number="formData.price" :min="0" class="w-full!" />
      </el-form-item>
      <el-form-item :label="$t('quantity')" prop="quantity" class="mb-0!">
        <el-input-number v-model.number="formData.quantity" :min="1" :precision="0" class="w-full!" />
      </el-form-item>
      <el-form-item :label="$t('note')" prop="note" class="mb-0!">
        <el-input v-model="formData.note" type="textarea" :placeholder="$t('note')" />
      </el-form-item>

      <el-form-item class="mb-0! mt-8">
        <el-button type="danger" text :disabled="!$hasPermission('sales.update')" @click="remove()">{{ $t('delete') }}</el-button>
        <div class="ml-auto">
          <el-button @click="close()">
            {{ $t("close") }}
          </el-button>
          <el-button type="primary" :disabled="!$hasPermission('sales.update')" @click="submit()">
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
import type { SaleItem, SaleItemUpdateBody } from '@/modules/sales/items/type';
import { useI18n } from 'vue-i18n';
import SaleItemsApi from '@/modules/sales/items/api';
import ProductApi from '@/modules/products/api';
import type { Product } from '@/modules/products/type';
import confirmDialog from '@/services/dialog/confirm';
import { ensurePermission } from '@/services/permission';

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const products = ref<Product[]>([]);

const formRules = reactive<Record<keyof SaleItemUpdateBody, FormItemRule | FormItemRule[]>>({
  uid: [{ required: true, message: t('required'), trigger: 'submit' }],
  product_uid: [{ required: true, message: t('required'), trigger: 'submit' }],
  price: [{ required: true, type: 'number', min: 0, message: t('required'), trigger: 'submit' }],
  quantity: [{ required: true, type: 'number', min: 1, message: t('required'), trigger: 'submit' }],
  note: [{ min: 3, max: 100, message: t('lengthShouldBe3To100'), trigger: 'submit' }]
});

const formData = ref<SaleItemUpdateBody>({
  uid: '',
  product_uid: '',
  price: 0,
  quantity: 1,
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
        message: 'areYouSureYouWantToUpdateThisItem?', title: 'updateItem',
        confirmButtonText: 'update', confirmButtonType: 'primary', cancelButtonText: 'cancel', type: 'info'
      });
      try {
        loadingContainer.value.push('submit');
        await SaleItemsApi.update(formData.value);
        ElMessage.success(t('itemUpdatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        ElMessage.error(error?.detail?.message || t('failedToUpdateItem'));
      } finally {
        loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
      }
    } else {
      const firstError = Object.values(fields!)[0][0];
      ElMessage.error(`${t(firstError.field!)}: ${firstError.message}`);
    }
  })
};

const remove = async () => {
  await confirmDialog({
    message: 'areYouSureYouWantToDeleteThisItem?', title: 'delete',
    confirmButtonText: 'delete', confirmButtonType: 'danger', cancelButtonText: 'cancel', type: 'warning'
  });
  try {
    loadingContainer.value.push('submit');
    await SaleItemsApi.remove(formData.value.uid);
    ElMessage.success(t('itemDeletedSuccessfully'));
    close(formRef.value, true);
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('failedToDeleteItem'));
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
  }
};

const open = async (data: SaleItem) => {
  if (!ensurePermission('sales.update')) return;
  dialogModel.value = true;
  try {
    loadingContainer.value.push('loading');
    const productsRes = await ProductApi.getAll();
    products.value = productsRes.detail.data;
    // Clone: binding the form to the grid's row object lets resetFields() (on close) wipe that row's fields.
    formData.value = { ...data };
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('loadingFailed'));
    dialogModel.value = false;
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'loading');
  }
};

defineExpose({ open });
</script>
