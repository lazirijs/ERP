<template>
  <detail-app ref="detailAppRef" :config="detailConfig" @edit="editDialogRef?.open()">
    <template #tab-projects>
      <projects-list-app :view="{ type: 'client', data: detailAppRef?.formData }" @updated="detailAppRef?.load()" />
    </template>
    <template #tab-sales>
      <sales-list-app :view="{ type: 'client', data: detailAppRef?.formData }" @updated="detailAppRef?.load()" />
    </template>
    <template #edit-dialog>
      <edit-dialog-app ref="editDialogRef" :uid="detailAppRef?.formData?.uid" @submitted="detailAppRef?.load()" />
    </template>
  </detail-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ClientApi from '@/modules/clients/api';
import type { Client } from '@/modules/clients/type';
import SalesListApp from '@/modules/sales/view/list.vue';
import EditDialogApp from '@/modules/clients/components/dialogs/edit.vue';
import ProjectsListApp from '@/modules/projects/view/list.vue';
import DetailApp from '@/layouts/shared/detail.vue';
import formatter from '@/services/formatter';
import { t } from '@/translate';

const detailAppRef = ref<InstanceType<typeof DetailApp>>();
const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();

const detailConfig = ref<InstanceType<typeof DetailApp>["$props"]["config"]>({
  load: ClientApi.get,
  sideBar: (data: Client) => [
    { label: t('name'), value: data.name },
    { label: t('contact'), value: data.contact },
    { label: t('address'), value: data.address },
    { label: t('totalProjects'), value: data.total_projects },
    { label: t('createdAt'), value: formatter.date(data.created_at) },
  ],
  tabs: [
    { name: 'projects', permission: 'projects.access' },
    { name: 'sales', permission: 'sales.access' },
  ],
  editPermission: 'clients.update',
});
</script>