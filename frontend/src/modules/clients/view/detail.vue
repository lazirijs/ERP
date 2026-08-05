<template>
  <detail-app :config="detailConfig" @edit="editDialogRef?.open()">
    <template #tab-projects>
      <projects-list-app :view="{ type: 'client', data: formData }" @updated="load()" />
    </template>
    <template #tab-sales>
      <sales-list-app :view="{ type: 'client', data: formData }" @updated="load()" />
    </template>
    <template #edit-dialog>
      <edit-dialog-app ref="editDialogRef" :uid="formData.uid" @submitted="load()" />
    </template>
  </detail-app>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import ClientApi from '@/modules/clients/api';
import type { Client } from '@/modules/clients/type';
import SalesListApp from '@/modules/sales/view/list.vue';
import EditDialogApp from '@/modules/clients/components/dialogs/edit.vue';
import ProjectsListApp from '@/modules/projects/view/list.vue';
import DetailApp from '@/layouts/shared/detail.vue';
import { t } from '@/translate';
import formatter from '@/services/formatter';

const route = useRoute();

const loadingContainer = ref<('detail')[]>([]);

const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();

const formData = ref<Client>({} as Client);

const load = async () => {
  try {
    loadingContainer.value.push('detail');
    const response = await ClientApi.get(route.params.uid as string);
    formData.value = response.detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'detail');
  }
};

const detailConfig = computed<InstanceType<typeof DetailApp>["$props"]["config"]>(() => ({
  load,
  loadingContainer: loadingContainer.value,
  sideBar: [
    { label: t('name'), value: formData.value.name },
    { label: t('contact'), value: formData.value.contact },
    { label: t('address'), value: formData.value.address },
    { label: t('totalProjects'), value: formData.value.total_projects },
    { label: t('createdAt'), value: formatter.date(formData.value.created_at) },
  ],
  tabs: [
    { name: 'projects', permission: 'projects.access' },
    { name: 'sales', permission: 'sales.access' },
  ],
  editPermission: 'clients.update',
}));

onMounted(load);
</script>