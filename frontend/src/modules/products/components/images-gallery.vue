<template>
  <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" @change="onAdd" class="flex justify-end mb-4">
    <el-button type="primary">
      <el-icon class="mr-2">
        <el-icon-plus />
      </el-icon>
      {{ $t('upload') }}
    </el-button>
  </el-upload>
  <div v-loading="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    <el-empty v-if="images.length === 0" :description="$t('noImages')" class="col-span-full" />
    <div v-else v-for="(img, index) in images" :key="index" :title="img.customMetadata?.fileName" class="relative group aspect-square rounded-lg overflow-hidden border bg-gray-100 border-gray-200">
      <a :href="$getFileUrl(img.key)" target="_blank" rel="noopener">
        <img :src="$previewImage({ type: 'image', src: img.key })" class="object-cover size-full" />
      </a>
      <el-button :type="props.image === img.key ? 'primary' : 'default'" class="absolute top-1 left-1" rounded size="small" circle @click="setPrimary(img.key)">
        <el-icon class="mb-0.5 mr-[0.025rem]"><el-icon-star-filled /></el-icon>
      </el-button>
      <el-button text type="danger" class="absolute top-1 right-1" size="small" circle @click="remove(img.key)">
        <el-icon class="mb-0.5 mr-[0.025rem]"><el-icon-delete /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { useI18n } from 'vue-i18n';
import ProductApi from '@/modules/products/api';
import type { ProductImage } from '@/modules/products/type';
import confirmDialog from '@/services/dialog/confirm';

const props = defineProps<{
  uid: string;
  image: string;
}>();

const emit = defineEmits(['changed']);

const { t } = useI18n();

const loading = ref(false);
const images = ref<ProductImage[]>([]);

const load = async () => {
  try {
    loading.value = true;
    const response = await ProductApi.getImages(props.uid);
    images.value = response.detail;
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('loadingFailed'));
  } finally {
    loading.value = false;
  }
};

onMounted(load);

const onAdd = async (uploadFile: UploadFile) => {
  if (!uploadFile.raw) return;
  try {
    loading.value = true;
    await ProductApi.uploadImage(props.uid, uploadFile.raw, false);
    await load();
    emit('changed');
    ElMessage.success(t('imageUploadedSuccessfully'));
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('failedToUploadImage'));
  } finally {
    loading.value = false;
  }
};

const setPrimary = async (image: string) => {
  try {
    loading.value = true;
    await ProductApi.setPrimaryImage(props.uid, image);
    await load();
    emit('changed');
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('failedToUploadImage'));
  } finally {
    loading.value = false;
  }
};

const remove = async (image: string) => {
  await confirmDialog({
    message: 'areYouSureYouWantToDeleteThisImage?',
    title: 'delete',
    confirmButtonText: 'delete',
    confirmButtonType: 'danger',
    cancelButtonText: 'cancel',
    type: 'warning'
  });

  try {
    loading.value = true;
    await ProductApi.deleteImage(props.uid, image);
    await load();
    emit('changed');
    ElMessage.success(t('imageDeletedSuccessfully'));
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('failedToDeleteImage'));
  } finally {
    loading.value = false;
  }
};
</script>