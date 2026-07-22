<template>
  <el-dialog v-model="dialogModel" :title="$t('editSupplier')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !$arrayHasAny(loadingContainer, ['loading', 'submit']) && done()">
    <el-form ref="formRef" v-loading="$arrayHasAny(loadingContainer, ['loading', 'submit'])" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item :label="$t('name')" prop="name" class="mb-0!">
        <el-input v-model="formData.name" :placeholder="$t('name')" />
      </el-form-item>

      <el-form-item :label="$t('contact')" prop="contact" class="mb-0!">
        <el-input v-model="formData.contact" :placeholder="$t('contact')" />
      </el-form-item>

      <el-form-item :label="$t('address')" prop="address" class="mb-0!">
        <el-input v-model="formData.address" :placeholder="$t('address')" />
      </el-form-item>

      <el-form-item :label="$t('description')" prop="description" class="mb-0!">
        <el-input v-model="formData.description" type="textarea" :rows="2" :placeholder="$t('description')" />
      </el-form-item>

      <el-form-item class="mb-0! mt-8">
        <div class="ml-auto">
          <el-button @click="close()">
            {{ $t("close") }}
          </el-button>
          <el-button type="primary" :disabled="!$hasPermission('suppliers.update')" @click="submit()">
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
import type { SupplierUpdateBody } from '@/modules/suppliers/type';
import { useI18n } from 'vue-i18n';
import SupplierApi from '../../api';
import confirmDialog from '@/services/dialog/confirm';
import { ensurePermission } from '@/services/permission';

const props = defineProps<{
  supplier_uid: string;
}>();

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof SupplierUpdateBody, FormItemRule | FormItemRule[]>>({
  uid: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ],
  contact: [
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ],
  address: [
    { min: 3, max: 100, message: t('lengthShouldBe3To100'), trigger: 'submit' },
  ],
  description: [
    { min: 3, max: 100, message: t('lengthShouldBe3To100'), trigger: 'submit' },
  ]
});

const formData = ref<SupplierUpdateBody>({
  uid: props.supplier_uid,
  name: '',
  description: '',
  contact: '',
  address: ''
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
        message: 'areYouSureYouWantToUpdateThisSupplier?',
        title: 'updateSupplier',
        confirmButtonText: 'update',
        confirmButtonType: 'primary',
        cancelButtonText: 'cancel',
        type: 'info'
      })
      try {
        loadingContainer.value.push('submit');
        await SupplierApi.update(formData.value);
        ElMessage.success(t('supplierUpdatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToUpdateSupplier');
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
  if (!ensurePermission('suppliers.update')) return;
  dialogModel.value = true;
  try {
    loadingContainer.value.push('loading');
    const response = await SupplierApi.get(props.supplier_uid);
    formData.value.uid = response.detail.uid;
    formData.value.name = response.detail.name;
    formData.value.description = response.detail.description;
    formData.value.contact = response.detail.contact;
    formData.value.address = response.detail.address;
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
});
</script>
