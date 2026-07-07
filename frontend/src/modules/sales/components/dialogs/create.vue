<template>
  <el-dialog v-model="dialogModel" :title="$t('createSale')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.length && done()">
    <el-form ref="formRef" v-loading="loadingContainer.length" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item :label="$t('name')" prop="name" class="mb-0!">
        <el-input v-model="formData.name" :placeholder="$t('name')" />
      </el-form-item>
      <el-form-item :label="$t('project')" prop="project_uid" class="mb-0!">
        <el-select v-model="formData.project_uid" clearable filterable :placeholder="$t('project')" class="w-full" @change="onProjectChange">
          <el-option v-for="project in projects" :key="project.uid" :label="project.name" :value="project.uid" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('client')" prop="client_uid" class="mb-0!">
        <el-select v-model="formData.client_uid" clearable filterable :disabled="!!formData.project_uid"  :placeholder="$t('client')" class="w-full">
          <el-option v-for="client in clients" :key="client.uid" :label="client.name" :value="client.uid" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('note')" prop="note" class="mb-0!">
        <el-input v-model="formData.note" type="textarea" :rows="2" :placeholder="$t('note')" />
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
import type { SaleCreateBody } from '@/modules/sales/type';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SaleApi from '@/modules/sales/api';
import ProjectApi from '@/modules/projects/api';
import ClientApi from '@/modules/clients/api';
import type { Project } from '@/modules/projects/type';
import type { Client } from '@/modules/clients/type';
import formatter from '@/services/formatter';
import confirmDialog from '@/services/dialog/confirm';

const emit = defineEmits(['submitted']);

const { t } = useI18n();
const router = useRouter();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const projects = ref<Project[]>([]);
const clients = ref<Client[]>([]);

const formRules = reactive<Record<keyof SaleCreateBody, FormItemRule | FormItemRule[]>>({
  name: [{ max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' }],
  project_uid: [],
  client_uid: [],
  note: [{ max: 255, message: t('lengthShouldBe3To100'), trigger: 'submit' }]
});

const formData = ref<SaleCreateBody>({
  name: '',
  project_uid: null,
  client_uid: null,
  note: ''
});

const onProjectChange = (project_uid: string) => {
  if (project_uid) formData.value.client_uid = projects.value.find(project => project.uid === project_uid).client.uid;
  else formData.value.client_uid = null;
};

const reset = (formEl: FormInstance | undefined = formRef.value) => {
  formEl?.resetFields();
  formData.value = { name: '', project_uid: null, client_uid: null, note: '' };
};

const close = (formEl: FormInstance | undefined = formRef.value, triggerSubmitted: boolean = false) => {
  reset(formEl);
  if (triggerSubmitted) emit('submitted');
  dialogModel.value = false;
};

const submit = async (formEl: FormInstance | undefined = formRef.value) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (!valid) {
      const firstError = Object.values(fields!)[0][0];
      ElMessage.error(`${t(firstError.field!)}: ${firstError.message}`);
      return;
    }
    if (!formData.value.project_uid && !formData.value.client_uid) {
      ElMessage.error(t('selectProjectOrClient'));
      return;
    }
    await confirmDialog({
      message: 'areYouSureYouWantToCreateThisSale?', title: 'createSale',
      confirmButtonText: 'create', confirmButtonType: 'primary', cancelButtonText: 'cancel', type: 'info'
    });
    try {
      loadingContainer.value.push('submit');
      const response = await SaleApi.create({ ...formData.value, note: formData.value.note || undefined });
      ElMessage.success(t('saleCreatedSuccessfully'));
      dialogModel.value = false;
      reset();
      router.push({ name: 'sales-detail', params: { uid: response.detail.uid } });
    } catch (error: any) {
      ElMessage.error(error?.detail?.message || t('failedToCreateSale'));
    } finally {
      loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
    }
  });
};

const open = async () => {
  dialogModel.value = true;
  formData.value.name = formatter.date(new Date().toISOString());
  try {
    loadingContainer.value.push('loading');
    const [projectsRes, clientsRes] = await Promise.all([ProjectApi.getAll(), ClientApi.getAll()]);
    projects.value = projectsRes.detail.data;
    clients.value = clientsRes.detail.data;
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('loadingFailed'));
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'loading');
  }
};

defineExpose({ open });
</script>
