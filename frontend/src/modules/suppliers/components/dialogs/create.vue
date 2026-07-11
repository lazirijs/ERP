<template>
  <el-dialog v-model="dialogModel" :title="$t('createSupplier')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <el-form ref="formRef" v-loading="loadingContainer.length" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
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
    </el-form>
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
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus'
import type { SupplierCreateBody } from '@/modules/suppliers/type';
import { useI18n } from 'vue-i18n';
import SupplierApi from '@/modules/suppliers/api';
import confirmDialog from '@/services/dialog/confirm';

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<( 'submit' )[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof SupplierCreateBody, FormItemRule | FormItemRule[]>>({
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ],
  contact: { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  address: { min: 3, max: 100, message: t('lengthShouldBe3To100'), trigger: 'submit' },
  description: { min: 3, max: 100, message: t('lengthShouldBe3To100'), trigger: 'submit' },
});

const formData = ref<SupplierCreateBody>({
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
        message: 'areYouSureYouWantToCreateThisSupplier?',
        title: 'createSupplier',
        confirmButtonText: 'create',
        confirmButtonType: 'primary',
        cancelButtonText: 'cancel',
        type: 'info'
      })
      try {
        loadingContainer.value.push('submit');
        await SupplierApi.create(formData.value);
        ElMessage.success(t('supplierCreatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToCreateSupplier');
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

const open = () => {
  dialogModel.value = true;
};

defineExpose({
  open
});
</script>
