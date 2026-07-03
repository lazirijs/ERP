import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import { locale, loadMessages } from "devextreme/localization";
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import AppStore from '@/stores/app';
import AuthStore from '@/modules/auth/store';
import { getAvatar } from '@/services/avatar';
import formatter from '@/services/formatter';
import { arrayHasAny } from '@/services';

import main from '@/layouts/main.vue';
import router from '@/router';
import i18n from "@/translate";

import { languages } from '@/translate/constants';
import type { LanguagesCode } from "@/translate/type";

import ContainerApp from '@/layouts/container.vue';
import DataGridApp from '@/components/devextreme/datagrid/index.vue';

import '@/style.css';

const app = createApp(main);

app.config.globalProperties.$appStore = AppStore;
app.config.globalProperties.$authStore = AuthStore;

app.config.globalProperties.$getAvatar = getAvatar;
app.config.globalProperties.$formatter = formatter;
app.config.globalProperties.$arrayHasAny = arrayHasAny;

app.use(router);
app.use(i18n);
// @ts-ignore
app.use(ElementPlus, { locale: languages[i18n.global.locale.value as LanguagesCode].locale.elementPlus });
app.use(createPinia());

app.use(() => {
  loadMessages(languages[i18n.global.locale.value as LanguagesCode].locale.devextreme);
  locale(i18n.global.locale.value);
})

app.component("container-app", ContainerApp);
app.component("data-grid-app", DataGridApp);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component("el-icon-" + key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(), component)
}

app.mount('#app');