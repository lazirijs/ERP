<template>
  <el-dialog v-model="dialogModel" :title="$t('createProduct')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <el-form ref="formRef" v-loading="loadingContainer.length" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item class="mb-0!">
        <el-upload class="mx-auto" :auto-upload="false" :show-file-list="false" accept="image/*" @change="onImageChange">
          <div class="size-65 overflow-hidden rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer">
            <template v-if="preview">
              <el-button text type="danger" class="absolute top-1 right-12" size="small" circle @click.stop="removeImagePreview">
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
        <el-input-number v-model="formData.price" :min="0" :controls="false" :parser="$formatter.number" :formatter="(amount: number) => $formatter.currency(amount, false)" class="w-full!">
          <template #suffix>
            <span>{{ currency }}</span>
          </template>
        </el-input-number>
      </el-form-item>

      <el-form-item :label="$t('description')" prop="description" class="mb-0!">
        <el-input v-model="formData.description" :placeholder="$t('description')" />
      </el-form-item>
    </el-form>
    <div class="flex justify-end gap-2 mb-0! mt-8">
      <el-button @click="close()">
        {{ $t("close") }}
      </el-button>
      <el-button type="primary" :disabled="!$hasPermission('products.create')" @click="submit()">
        {{ $t("create") }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule, UploadFile } from 'element-plus'
import type { ProductCreateBody } from '@/modules/products/type';
import { useI18n } from 'vue-i18n';
import ProductApi from '@/modules/products/api';
import { currency } from "@/constants";
import confirmDialog from '@/services/dialog/confirm';
import { ensurePermission } from '@/services/permission';

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<( 'submit' )[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const image = ref<File | null>(null);
const preview = ref<string>('');

const formRules = reactive<Record<keyof ProductCreateBody, FormItemRule | FormItemRule[]>>({
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ],
  price: [],
  description: { min: 3, max: 100, message: t('lengthShouldBe3To100'), trigger: 'submit' },
});

const formData = ref<ProductCreateBody>({
  name: '',
  price: 0,
  description: ''
});

const removeImagePreview = () => {
  image.value = null;
  preview.value = '';
};

const onImageChange = (uploadFile: UploadFile) => {
  image.value = uploadFile.raw ?? null;
  preview.value = uploadFile.raw ? URL.createObjectURL(uploadFile.raw) : '';
};

const reset = (formEl: FormInstance | undefined = formRef.value) => {
  image.value = null;
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
        message: 'areYouSureYouWantToCreateThisProduct?',
        title: 'createProduct',
        confirmButtonText: 'create',
        confirmButtonType: 'primary',
        cancelButtonText: 'cancel',
        type: 'info'
      })
      try {
        loadingContainer.value.push('submit');
        const response = await ProductApi.create(formData.value);
        if (image.value) await ProductApi.uploadImage(response.detail.uid, image.value, true);
        ElMessage.success(t('productCreatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToCreateProduct');
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
  if (!ensurePermission('products.create')) return;
  dialogModel.value = true;
};

defineExpose({
  open
});
</script>
