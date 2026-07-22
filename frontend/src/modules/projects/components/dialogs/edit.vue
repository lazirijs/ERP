<template>
  <el-dialog v-model="dialogModel" :title="$t('editProject')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !$arrayHasAny(loadingContainer, ['loading', 'submit']) && done()">
    <el-form ref="formRef" v-loading="$arrayHasAny(loadingContainer, ['loading', 'submit'])" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item :label="$t('name')" prop="name" class="mb-0!">
        <el-input v-model="formData.name" :placeholder="$t('project')" />
      </el-form-item>

      <el-form-item :label="$t('client')" prop="client_uid" class="mb-0!">
        <el-select v-model="formData.client_uid" :placeholder="$t('client')" filterable>
          <el-option v-for="client in clients" :key="client.uid" :label="client.name" :value="client.uid" />
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('status')" prop="status" class="mb-0!">
        <el-select v-model="formData.status" :placeholder="$t('status')" class="w-full el-select-on-focus-no-outline">
          <template #label="{ label, value }">
            <span :class="`badge-app-${status[value as keyof typeof status].color} p-1!`">
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

      <el-form-item :label="$t('offer')" prop="offer" class="mb-0!">
        <el-input-number v-model="formData.offer" :min="0" :controls="false" :parser="$formatter.number" :formatter="(amount: number) => $formatter.currency(amount, false)" class="w-full!">
          <template #suffix>
            <span>{{ currency }}</span>
          </template>
        </el-input-number>
      </el-form-item>

      <el-form-item :label="$t('note')" prop="note" class="mb-0!">
        <el-input v-model="formData.note" type="textarea" :rows="2" :placeholder="$t('note')" />
      </el-form-item>
    </el-form>
    <div class="flex justify-end gap-2 mb-0! mt-8">
      <el-button @click="close()">
        {{ $t("close") }}
      </el-button>
      <el-button type="primary" :disabled="!$hasPermission('projects.update')" @click="submit()">
        {{ $t("save") }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import ProjectApi from '@/modules/projects/api';
import { status } from '@/modules/projects/constant';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus'
import type { ProjectUpdateBody } from '@/modules/projects/type';
import type { Client } from '@/modules/clients/type';
import type { Category } from '@/modules/projects/categories/type';
import ClientApi from '@/modules/clients/api';
import CategoryApi from '@/modules/projects/categories/api';
import confirmDialog from '@/services/dialog/confirm';
import { currency } from '@/constants';
import { ensurePermission } from '@/services/permission';

const props = defineProps<{
  uid: string;
}>();

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<( 'loading' | 'submit' )[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof ProjectUpdateBody, FormItemRule | FormItemRule[]>>({
  uid: { required: true, message: t('required'), trigger: 'submit' },
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ],
  client_uid: { required: true, message: t('required'), trigger: 'submit' },
  region_uid: { required: true, message: t('required'), trigger: 'submit' },
  category_uid: { required: true, message: t('required'), trigger: 'submit' },
  status: { required: true, message: t('required'), trigger: 'submit' },
  offer: { type: "number", message: t('shouldBeNumber'), trigger: 'submit' },
  note: { max: 255, message: t('lengthShouldBe3To100'), trigger: 'submit' },
  description: { max: 255, message: t('lengthShouldBe3To100'), trigger: 'submit' },
});

const formData = ref<ProjectUpdateBody>({
  uid: props.uid,
  name: '',
  client_uid: '',
  region_uid: '',
  category_uid: '',
  status: 0,
  offer: 0,
  note: '',
  description: ''
});

const clients = ref<Client[]>([]);
const categories = ref<Category[]>([]);

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
        message: 'areYouSureYouWantToUpdateThisProject?',
        title: 'updateProject',
        confirmButtonText: 'update',
        confirmButtonType: 'primary',
        cancelButtonText: 'cancel',
        type: 'info',
      })
      try {
        loadingContainer.value.push('submit');
        await ProjectApi.update(formData.value);
        ElMessage.success(t('projectUpdatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToUpdateProject');
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
  if (!ensurePermission('projects.update')) return;
  dialogModel.value = true;
  try {
    loadingContainer.value.push('loading');
    const [projectRes, clientsRes, categoriesRes] = await Promise.all([
      ProjectApi.get(props.uid),
      ClientApi.getAll(),
      CategoryApi.getAll()
    ]);
    clients.value = clientsRes.detail.data;
    categories.value = categoriesRes.detail.data;
    const project = projectRes.detail;
    formData.value = {
      uid: project.uid,
      name: project.name,
      client_uid: project.client_uid,
      region_uid: project.region_uid,
      category_uid: project.category_uid,
      status: project.status,
      offer: project.offer ?? 0,
      note: project.note ?? '',
      description: project.description ?? ''
    };
  } catch (error: any) {
    const errorMessage = error?.detail?.message || t('loadingFailed');
    ElMessage.error(errorMessage);
    dialogModel.value = false;
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'loading');
  }
};

defineExpose({ open });
</script>
