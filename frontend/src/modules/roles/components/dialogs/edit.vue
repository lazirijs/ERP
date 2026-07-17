<template>
  <el-dialog v-model="dialogModel" :title="$t('editRole')" align-center class="min-w-11/12 md:min-w-2/5! md:max-w-2/5!" @closed="reset()" :before-close="(done: any) => !$arrayHasAny(loadingContainer, ['loading', 'submit']) && done()">
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

      <el-form-item class="mb-0! mt-8">
        <el-button type="danger" text @click="remove()">{{ $t('delete') }}</el-button>
        <div class="ml-auto">
          <el-button @click="close()">{{ $t("close") }}</el-button>
          <el-button type="primary" @click="submit()">{{ $t("save") }}</el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, watch } from 'vue';
import { ElMessage, type ElTree } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus'
import type { RoleUpdateBody } from '@/modules/roles/type';
import type { Permission, PermissionNode } from '@/modules/permissions/type';
import { useI18n } from 'vue-i18n';
import RoleApi from '@/modules/roles/api';
import PermissionApi from '@/modules/permissions/api';
import confirmDialog from '@/services/dialog/confirm';

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

const formData = ref<RoleUpdateBody>({
  uid: '',
  name: '',
  description: '',
  permission_uids: []
});

const buildTree = (perms: Permission[]): PermissionNode[] =>
  perms.filter(p => !p.parent_uid).map(parent => ({
    ...parent,
    children: perms.filter(c => c.parent_uid === parent.uid)
  }));

// Cascading checkboxes: fully-checked nodes come from getCheckedKeys; a parent with only some
// children checked is half-checked. Both count as granted, so a checked child persists its
// parent ".access" permission too.
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
        message: 'areYouSureYouWantToUpdateThisRole?', title: 'updateRole',
        confirmButtonText: 'update', confirmButtonType: 'primary', cancelButtonText: 'cancel', type: 'info'
      });
      try {
        loadingContainer.value.push('submit');
        await RoleApi.update({ ...formData.value, permission_uids: collectPermissionUids() });
        ElMessage.success(t('roleUpdatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        ElMessage.error(error?.detail?.message || t('failedToUpdateRole'));
      } finally {
        loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
      }
    } else {
      const firstError = Object.values(fields!)[0][0];
      ElMessage.error(`${t(firstError.field!)}: ${firstError.message}`);
    }
  })
};

const remove = async () => {
  await confirmDialog({
    message: 'areYouSureYouWantToDeleteThisRole?', title: 'delete',
    confirmButtonText: 'delete', confirmButtonType: 'danger', cancelButtonText: 'cancel', type: 'warning'
  });
  try {
    loadingContainer.value.push('submit');
    await RoleApi.remove(formData.value.uid);
    ElMessage.success(t('roleDeletedSuccessfully'));
    close(formRef.value, true);
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('failedToDeleteRole'));
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
  }
};

const open = async (uid: string) => {
  dialogModel.value = true;
  try {
    loadingContainer.value.push('loading');
    const [permsRes, roleRes] = await Promise.all([PermissionApi.getAll(), RoleApi.get(uid)]);
    flatPermissions.value = permsRes.detail;
    permissionTree.value = buildTree(permsRes.detail);
    formData.value.uid = roleRes.detail.uid;
    formData.value.name = roleRes.detail.name;
    formData.value.description = roleRes.detail.description ?? '';
    // Wait for the tree to render before checking the assigned nodes. With cascading
    // checkboxes we set only the leaf (child) permissions and let el-tree derive each
    // parent's checked/half-checked state — passing a parent key would cascade-check all
    // of its children.
    await nextTick();
    const childKeys = roleRes.detail.permission_uids.filter((uid: string) =>
      flatPermissions.value.find(p => p.uid === uid)?.parent_uid);
    treeRef.value?.setCheckedKeys(childKeys);
  } catch (error: any) {
    ElMessage.error(error?.detail?.message || t('loadingFailed'));
    dialogModel.value = false;
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'loading');
  }
};

defineExpose({ open });
</script>
