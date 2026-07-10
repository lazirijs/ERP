<template>
  <el-upload :auto-upload="false" :show-file-list="false" accept=".pdf,.csv,.xls,.xlsx,image/*" @change="onAdd" class="flex justify-end mb-4">
    <el-button type="primary">
      <el-icon class="mr-2"><el-icon-plus /></el-icon>
      {{ $t('upload') }}
    </el-button>
  </el-upload>
  <div v-loading="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    <el-empty v-if="!documents.length" :description="$t('noDocuments')" class="col-span-full" />
    <div v-else v-for="(doc, index) in documents" :key="index" :title="doc.customMetadata?.fileName" class="relative group aspect-square rounded-lg overflow-hidden border bg-gray-100 border-gray-200">
      <a :href="$getFileUrl(doc.key)" target="_blank" rel="noopener" download class="block size-full">
        <img v-if="isImage(doc.key)" :src="$previewImage({ type: 'image', src: doc.key })" class="object-cover size-full" />
        <div v-else class="flex flex-col items-center justify-center size-full gap-2 text-gray-400">
          <el-icon :size="40"><el-icon-document /></el-icon>
          <span class="text-xs font-medium uppercase">{{ getFileExtension(doc.key) }}</span>
        </div>
      </a>
      <el-button text type="danger" class="absolute top-1 right-1" size="small" circle @click="remove(doc.key)">
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
import indexApi from '../api';
import confirmDialog from '@/services/dialog/confirm';
import { getFileExtension, isImage } from '@/services/files';
import type { StorageObject } from '@/shared/storage/type';

const props = defineProps<{
  uid: string;
}>();

// The profile picture may be among these documents; notify the parent so it can refresh the avatar
const emit = defineEmits(['changed']);

const { t } = useI18n();

const loading = ref(false);
const documents = ref<StorageObject[]>([]);

const load = async () => {
  try {
    loading.value = true;
    const response = await indexApi.getDocuments(props.uid);
    documents.value = response.detail;
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
    await indexApi.uploadDocument(props.uid, uploadFile.raw);
    await load();
    ElMessage.success(t('documentUploadedSuccessfully'));
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('failedToUploadDocument'));
  } finally {
    loading.value = false;
  }
};

const remove = async (document: string) => {
  await confirmDialog({
    message: 'areYouSureYouWantToDeleteThisDocument?', title: 'delete',
    confirmButtonText: 'delete', confirmButtonType: 'danger', cancelButtonText: 'cancel', type: 'warning'
  });
  try {
    loading.value = true;
    await indexApi.deleteDocument(props.uid, document);
    await load();
    emit('changed');
    ElMessage.success(t('documentDeletedSuccessfully'));
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('failedToDeleteDocument'));
  } finally {
    loading.value = false;
  }
};
</script>
