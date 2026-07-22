<template>
  <el-dialog v-model="dialogModel" :title="$t('editProduct')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !$arrayHasAny(loadingContainer, ['loading', 'submit']) && done()">
    <el-form ref="formRef" v-loading="$arrayHasAny(loadingContainer, ['loading', 'submit'])" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item class="mb-0!">
        <el-upload class="mx-auto" :auto-upload="false" :show-file-list="false" accept="image/*" @change="onImageChange">
          <div class="size-65 overflow-hidden rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer">
            <template v-if="preview">
              <el-button v-if="newImageSelected" text type="danger" class="absolute top-1 right-12" size="small" circle @click.stop="removeImagePreview">
                <el-icon><el-icon-close /></el-icon>
              </el-button>
              <img :src="preview" class="object-cover w-full" />
            </template>
            <el-icon v-else class="text-gray-400" :size="40"><el-icon-plus /></el-icon>
          </div>
        </el-upload>
      </el-form-item>

      <el-form-item :label="$t('name')" prop="name" class="mb-0!">
        <el-input v-model="formData.name" :placeholder="$t('name')" />
      </el-form-item>

      <el-form-item :label="$t('price')" prop="price" class="mb-0!">
        <currency-input-app v-model="formData.price" :min="0" class="w-full!" />
      </el-form-item>

      <el-form-item :label="$t('description')" prop="description" class="mb-0!">
        <el-input v-model="formData.description" :placeholder="$t('description')" />
      </el-form-item>

      <el-form-item class="mb-0! mt-8">
        <div class="ml-auto">
          <el-button @click="close()">
            {{ $t("close") }}
          </el-button>
          <el-button type="primary" :disabled="!$hasPermission('products.update')" @click="submit()">
            {{ $t("save") }}
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule, UploadFile } from 'element-plus'
import type { ProductUpdateBody } from '@/modules/products/type';
import { useI18n } from 'vue-i18n';
import { previewImage } from '@/services/files';
import ProductApi from '../../api';
import confirmDialog from '@/services/dialog/confirm';
import { ensurePermission } from '@/services/permission';

const props = defineProps<{
  product_uid: string;
}>();

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const originalProductImage = ref<string>();
const image = ref<File>();
const preview = ref<string>();
const newImageSelected = computed<boolean>(() => preview.value !== previewImage({ src: originalProductImage.value }));

const formRules = reactive<Record<keyof ProductUpdateBody, FormItemRule | FormItemRule[]>>({
  uid: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ],
  price: [],
  description: [
    { min: 3, max: 100, message: t('lengthShouldBe3To100'), trigger: 'submit' },
  ]
});

const formData = ref<ProductUpdateBody>({
  uid: props.product_uid,
  name: '',
  price: 0,
  description: ''
});

const onImageChange = (uploadFile?: UploadFile) => {
  image.value = uploadFile?.raw;
  preview.value = uploadFile?.raw ? URL.createObjectURL(uploadFile.raw) : '';
};

const removeImagePreview = () => {
  onImageChange();
  preview.value = originalProductImage.value ? previewImage({ type: 'image', src: originalProductImage.value }) : '';
};

const reset = (formEl: FormInstance | undefined = formRef.value) => {
  image.value = undefined;
  preview.value = '';
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
        message: 'areYouSureYouWantToUpdateThisProduct?',
        title: 'updateProduct',
        confirmButtonText: 'update',
        confirmButtonType: 'primary',
        cancelButtonText: 'cancel',
        type: 'info'
      })
      try {
        loadingContainer.value.push('submit');
        await ProductApi.update(formData.value);
        if (image.value) await ProductApi.uploadImage(formData.value.uid, image.value, true);
        ElMessage.success(t('productUpdatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToUpdateProduct');
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
  if (!ensurePermission('products.update')) return;
  dialogModel.value = true;
  try {
    loadingContainer.value.push('loading');
    const response = await ProductApi.get(props.product_uid);
    formData.value.uid = response.detail.uid;
    formData.value.name = response.detail.name;
    formData.value.price = response.detail.price;
    formData.value.description = response.detail.description;
    originalProductImage.value = response.detail.image;
    preview.value = response.detail.image ? previewImage({ type: 'image', src: response.detail.image }) : '';
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
