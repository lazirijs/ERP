<template>
  <el-dialog v-model="dialogModel" :title="$t('createItem')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <el-form ref="formRef" v-loading="loadingContainer.includes('submit')" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full">
      <el-form-item :label="$t('name')" prop="name">
        <el-input v-model="formData.name" :placeholder="$t('name')" />
      </el-form-item>

      <el-form-item :label="$t('unit')" prop="unit">
        <el-input v-model="formData.unit" :placeholder="$t('unit')" />
      </el-form-item>

      <el-form-item :label="$t('quantity')" prop="requested_quantity">
        <el-input v-model.number="formData.requested_quantity" :placeholder="$t('quantity')" />
      </el-form-item>

      <el-form-item :label="$t('note')" prop="note">
        <el-input v-model="formData.note" :placeholder="$t('note')" />
      </el-form-item>

      <el-form-item class="mb-0! mt-8">
        <div class="ml-auto">
          <el-button @click="close()">
            {{ $t("close") }}
          </el-button>
          <el-button type="primary" @click="submit()">
            {{ $t("create") }}
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
import type { ItemCreateBody } from '../../type';
import ItemsApi from '../../api';
import confirmDialog from '@/services/dialog/confirm';

const props = defineProps<{
  order_uid: string;
}>();

const emit = defineEmits(['submitted']);

const { t } = useI18n();

const loadingContainer = ref<('submit' | 'loading')[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof ItemCreateBody, FormItemRule | FormItemRule[]>>({
  order_uid: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  unit: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 1, max: 50, message: t('lengthShouldBe1To50'), trigger: 'submit' },
  ],
  requested_quantity: [
    { required: true, type: 'number', message: t('required'), trigger: 'submit' },
  ],
  note: [
    { max: 250, message: t('MaxLengthIs250'), trigger: 'submit' },
  ]
});

const formData = ref<ItemCreateBody>({
  order_uid: props.order_uid,
  name: '',
  unit: '',
  requested_quantity: 0,
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
        message: 'areYouSureYouWantToAddThisItem?',
        title: 'addItem',
        confirmButtonText: 'add',
        confirmButtonType: 'primary',
        cancelButtonText: 'cancel',
        type: 'info'
      })
      try {
        loadingContainer.value.push('submit');
        await ItemsApi.create(formData.value);
        ElMessage.success(t('itemAddedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToAddItem');
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

defineExpose({
  open: () => {
    dialogModel.value = true;
    formData.value.order_uid = props.order_uid;
  },
  // close: () => close()
});
</script>