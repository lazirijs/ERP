<template>
  <el-dialog v-model="dialogModel" :title="$t('createRole')" align-center class="min-w-11/12 md:min-w-2/5! md:max-w-2/5!" @closed="reset()" :before-close="(done: any) => !$arrayHasAny(loadingContainer, ['loading', 'submit']) && done()">
    <el-form ref="formRef" v-loading="$arrayHasAny(loadingContainer, ['loading', 'submit'])" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
      <el-form-item :label="$t('name')" prop="name" class="mb-0!">
        <el-input v-model="formData.name" :placeholder="$t('name')" />
      </el-form-item>

      <el-form-item :label="$t('description')" prop="description" class="mb-0!">
        <el-input v-model="formData.description" type="textarea" :rows="2" :placeholder="$t('description')" />
      </el-form-item>

      <el-form-item :label="$t('permissions')" class="mb-0!">
        <div class="w-full">
          <el-input v-model="permissionSearch" :placeholder="$t('search')" clearable class="mb-2">
            <template #prefix>
              <el-icon>
                <el-icon-search />
              </el-icon>
            </template>
          </el-input>
          <el-scrollbar max-height="16rem" class="w-full border border-gray-200 rounded-lg">
            <el-tree
              ref="treeRef"
              :data="permissionTree"
              show-checkbox
              node-key="uid"
              :props="{ label: 'name', children: 'children' }"
              :default-expand-all="true"
              :filter-node-method="filterNode"
              class="w-full p-2"
            />
          </el-scrollbar>
        </div>
      </el-form-item>
    </el-form>
    <div class="flex justify-end gap-2 mt-8">
      <el-button @click="close()">{{ $t("close") }}</el-button>
      <el-button type="primary" :disabled="!$hasPermission('roles.create')" @click="submit()">{{ $t("create") }}</el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage, type ElTree } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus'
import type { RoleCreateBody } from '@/modules/roles/type';
import type { Permission, PermissionNode } from '@/modules/permissions/type';
import { useI18n } from 'vue-i18n';
import RoleApi from '@/modules/roles/api';
import PermissionApi from '@/modules/permissions/api';
import confirmDialog from '@/services/dialog/confirm';
import { ensurePermission } from '@/services/permission';

const emit = defineEmits<{ submitted: [] }>();

const { t } = useI18n();

const loadingContainer = ref<('loading' | 'submit')[]>([]);

const formRef = ref<FormInstance>();
const treeRef = ref<InstanceType<typeof ElTree>>();
const dialogModel = ref<boolean>(false);

const flatPermissions = ref<Permission[]>([]);
const permissionTree = ref<PermissionNode[]>([]);
const permissionSearch = ref('');

watch(permissionSearch, (value) => treeRef.value?.filter(value));

const filterNode = (value: string, data: Permission) => !value || data.name.toLowerCase().includes(value.toLowerCase());

const formRules = reactive<Record<string, FormItemRule | FormItemRule[]>>({
  name: [
    { required: true, message: t('required'), trigger: 'submit' },
    { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
  ],
  description: [{ min: 3, max: 255, message: t('lengthShouldBe3To255'), trigger: 'submit' }]
});

const formData = ref<RoleCreateBody>({
  name: '',
  description: '',
  permission_uids: []
});

// Build a two-level tree (module -> actions) from the flat catalog.
const buildTree = (perms: Permission[]): PermissionNode[] =>
  perms.filter(p => !p.parent_uid).map(parent => ({
    ...parent,
    children: perms.filter(c => c.parent_uid === parent.uid)
  }));

// Cascading checkboxes: a fully-checked node is in getCheckedKeys; a parent with only some
// children checked is half-checked. Both count as granted, so a checked child also persists
// its parent ".access" permission.
const collectPermissionUids = (): string[] => {
  const checked = (treeRef.value?.getCheckedKeys() ?? []) as string[];
  const half = (treeRef.value?.getHalfCheckedKeys() ?? []) as string[];
  return [...new Set([...checked, ...half])];
};

const reset = (formEl: FormInstance | undefined = formRef.value) => {
  if (!formEl) return;
  formEl.resetFields();
  treeRef.value?.setCheckedKeys([]);
  permissionSearch.value = '';
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
        message: 'areYouSureYouWantToCreateThisRole?', title: 'createRole',
        confirmButtonText: 'create', confirmButtonType: 'primary', cancelButtonText: 'cancel', type: 'info'
      });
      try {
        loadingContainer.value.push('submit');
        await RoleApi.create({ ...formData.value, permission_uids: collectPermissionUids() });
        ElMessage.success(t('roleCreatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        ElMessage.error(error?.detail?.message || t('failedToCreateRole'));
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
  if (!ensurePermission('roles.create')) return;
  dialogModel.value = true;
  try {
    loadingContainer.value.push('loading');
    const response = await PermissionApi.getAll();
    flatPermissions.value = response.detail;
    permissionTree.value = buildTree(response.detail);
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('loadingFailed'));
    dialogModel.value = false;
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'loading');
  }
};

defineExpose({ open });
</script>
