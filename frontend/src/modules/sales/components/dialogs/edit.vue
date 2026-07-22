<template>
  <el-dialog v-model="dialogModel" :title="$t('editSale')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !$arrayHasAny(loadingContainer, ['loading', 'submit']) && done()">
    <el-form ref="formRef" v-loading="$arrayHasAny(loadingContainer, ['loading', 'submit'])" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item :label="$t('name')" prop="name" class="mb-0!">
        <el-input v-model="formData.name" :placeholder="$t('name')" />
      </el-form-item>
      <el-form-item :label="$t('project')" prop="project_uid" class="mb-0!">
        <el-select v-model="formData.project_uid" clearable filterable :placeholder="$t('project')" class="w-full" @change="onProjectChange">
          <el-option v-for="project in projects" :key="project.uid" :label="project.name" :value="project.uid" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('client')" prop="client_uid" class="mb-0!">
        <el-select v-model="formData.client_uid" clearable filterable :disabled="!!formData.project_uid" :placeholder="$t('client')" class="w-full">
          <el-option v-for="client in clients" :key="client.uid" :label="client.name" :value="client.uid" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('status')" prop="status" class="mb-0!">
        <el-select v-model="formData.status" :placeholder="$t('status')" class="w-full el-select-on-focus-no-outline">
          <template #label="{ label, value }">
            <span :class="`badge-app-${status[value as 0 | 1].color} p-1!`">
              {{ $t(label) }}
            </span>
          </template>
          <el-option v-for="({ id, label, color }) in status" :key="id" :label="$t(label)" :value="id">
            <span :class="`badge-app-${color}`">
              {{ $t(label) }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('note')" prop="note" class="mb-0!">
        <el-input v-model="formData.note" type="textarea" :rows="2" :placeholder="$t('note')" />
      </el-form-item>

      <el-form-item class="mb-0! mt-8">
        <div class="ml-auto">
          <el-button @click="close()">
            {{ $t("close") }}
          </el-button>
          <el-button type="primary" :disabled="!$hasPermission('sales.update')" @click="submit()">
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
import type { SaleUpdateBody } from '@/modules/sales/type';
import { useI18n } from 'vue-i18n';
import SaleApi from '@/modules/sales/api';
import ProjectApi from '@/modules/projects/api';
import ClientApi from '@/modules/clients/api';
import type { Project } from '@/modules/projects/type';
import type { Client } from '@/modules/clients/type';
import { status } from '@/modules/sales/constant';
import confirmDialog from '@/services/dialog/confirm';
import { ensurePermission } from '@/services/permission';

const props = defineProps<{
  sale_uid: string;
}>();

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const projects = ref<Project[]>([]);
const clients = ref<Client[]>([]);

const formRules = reactive<Record<keyof SaleUpdateBody, FormItemRule | FormItemRule[]>>({
  uid: [{ required: true, message: t('required'), trigger: 'submit' }],
  name: [{ max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' }],
  project_uid: [],
  client_uid: [],
  status: [{ required: true, message: t('required'), trigger: 'submit' }],
  note: [{ max: 255, message: t('lengthShouldBe3To100'), trigger: 'submit' }]
});

const formData = ref<SaleUpdateBody>({
  uid: props.sale_uid,
  name: '',
  project_uid: null,
  client_uid: null,
  status: 0,
  note: ''
});

const onProjectChange = (project_uid?: string) => {
  if (project_uid) formData.value.client_uid = projects.value.find(project => project.uid === project_uid)!.client.uid;
  else formData.value.client_uid = null;
};

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
      message: 'areYouSureYouWantToUpdateThisSale?', title: 'updateSale',
      confirmButtonText: 'update', confirmButtonType: 'primary', cancelButtonText: 'cancel', type: 'info'
    });
    try {
      loadingContainer.value.push('submit');
      await SaleApi.update(formData.value);
      ElMessage.success(t('saleUpdatedSuccessfully'));
      close(formEl, true);
    } catch (error: any) {
      ElMessage.error(error?.detail?.message || t('failedToUpdateSale'));
    } finally {
      loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
    }
  });
};

const open = async () => {
  if (!ensurePermission('sales.update')) return;
  dialogModel.value = true;
  try {
    loadingContainer.value.push('loading');
    const [saleRes, projectsRes, clientsRes] = await Promise.all([
      SaleApi.get(props.sale_uid),
      ProjectApi.getAll(),
      ClientApi.getAll()
    ]);
    projects.value = projectsRes.detail.data;
    clients.value = clientsRes.detail.data;
    formData.value.uid = saleRes.detail.uid;
    formData.value.name = saleRes.detail.name;
    formData.value.project_uid = saleRes.detail.project_uid ?? null;
    if (formData.value.project_uid) onProjectChange(saleRes.detail.project_uid);
    else if (!formData.value.client_uid) formData.value.client_uid = saleRes.detail.client_uid ?? null;
    formData.value.status = saleRes.detail.status;
    formData.value.note = saleRes.detail.note ?? '';
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('loadingFailed'));
    dialogModel.value = false;
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'loading');
  }
};

defineExpose({ open });
</script>

<style>
.el-select.el-select-no-focus-outline > .el-select__wrapper.is-focused {
  box-shadow: 0 0 0 1px var(--el-border-color) inset !important;
}
</style>
