import { ComponentCustomProperties } from 'vue';
import AppStore from '@/stores/app';
import AuthStore from '@/modules/auth/store';
import formatter from '@/services/formatter';
import { arrayHasAny } from '@/services';

declare module 'vue' {
  interface ComponentCustomProperties {
    $appStore: () => ReturnType<typeof AppStore>;
    $authStore: () => ReturnType<typeof AuthStore>;
    $getAvatar: (url: any) => string;
    $formatter: typeof formatter;
    $arrayHasAny: typeof arrayHasAny;
  }
  interface GlobalComponents {
    'container-app': typeof import('@/layouts/container.vue')['default'];
    'data-grid-app': typeof import('@/components/devextreme/datagrid/index.vue')['default'];
  }
}

export {};