<template>
  <el-dialog v-model="dialogModel" :title="$t('editOrder')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !$arrayHasAny(loadingContainer, ['loading', 'submit']) && done()">
    <el-form ref="formRef" v-loading="$arrayHasAny(loadingContainer, ['loading', 'submit'])" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full">
      <el-form-item :label="$t('name')" prop="name">
        <el-input v-model="formData.name" :placeholder="$t('name')" />
      </el-form-item>
      
      <el-form-item :label="$t('status')" prop="status">
        <el-select v-model="formData.status" :placeholder="$t('status')" filterable>
          <el-option v-for="({ label, id }) in status" :key="id" :label="$t(label)" :value="id" />
        </el-select>
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
import type { OrderUpdateBody } from '../../type';
import OrdersApi from '../../api';
import { status } from '../../constant';
import confirmDialog from '@/services/dialog/confirm';

const props = defineProps<{
  uid: string;
}>();

const emit = defineEmits(['submitted']);

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof OrderUpdateBody, FormItemRule | FormItemRule[]>>({
  uid: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  status: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  note: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ]
});

const formData = ref<OrderUpdateBody>({ 
  uid: props.uid,
  name: '',
  status: 0,
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
        message: 'areYouSureYouWantToUpdateThisOrder?',
        title: 'updateOrder',
        confirmButtonText: 'update',
        confirmButtonType: 'primary',
        cancelButtonText: t('cancel'),
        type: 'info'
      })
      try {
        loadingContainer.value.push('submit');
        await OrdersApi.update(formData.value);
        ElMessage.success(t('orderUpdatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToUpdateOrder');
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
    const response = await OrdersApi.get(props.uid);
    formData.value = {
      name: response.detail.name,
      uid: response.detail.uid,
      status: response.detail.status,
      note: response.detail.note,
    }
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