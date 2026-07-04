import { ComponentCustomProperties } from 'vue';
import AppStore from '@/stores/app';
import AuthStore from '@/modules/auth/store';
import formatter from '@/services/formatter';
import { arrayHasAny } from '@/services';
import { previewImage } from '@/services/files';

declare module 'vue' {
  interface ComponentCustomProperties {
    $appStore: () => ReturnType<typeof AppStore>;
    $authStore: () => ReturnType<typeof AuthStore>;
    $previewImage: typeof previewImage;
    $arrayHasAny: typeof arrayHasAny;
    $formatter: typeof formatter;
  }
  interface GlobalComponents {
    'container-app': typeof import('@/layouts/container.vue')['default'];
    'data-grid-app': typeof import('@/components/devextreme/datagrid/index.vue')['default'];
  }
}

export {};