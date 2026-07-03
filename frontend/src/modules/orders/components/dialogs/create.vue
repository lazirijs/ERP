<template>
  <el-dialog v-model="dialogModel" :title="$t('createOrder')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <el-form ref="formRef" v-loading="loadingContainer.includes('submit')" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full">
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
            {{ $t("create") }}
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus'
import type { OrderCreateBody } from '../../type';
import { useI18n } from 'vue-i18n';
import OrdersApi from '../../api';
import { status } from '../../constant';

const props = defineProps<{
  project_uid: string;
}>();

const emit = defineEmits(['submitted']);

const { t } = useI18n();

const loadingContainer = ref<('submit')[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof OrderCreateBody, FormItemRule | FormItemRule[]>>({
  project_uid: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  status: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  note: [
    { max: 250, message: t('MaxLengthIs250'), trigger: 'submit' },
  ]
});

const formData = ref<OrderCreateBody>({
  project_uid: props.project_uid,
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
      await ElMessageBox.confirm(
        t('areYouSureYouWantToCreateThisOrder?'),
        t('createOrder'),
        {
          confirmButtonText: t('create'),
          confirmButtonType: 'primary',
          cancelButtonText: t('cancel'),
          type: 'info',
        }
      )
      try {
        loadingContainer.value.push('submit');
        await OrdersApi.create(formData.value);
        ElMessage.success(t('orderCreatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToCreateOrder');
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
    formData.value.project_uid = props.project_uid;
  },
  // close: () => close()
});
</script>