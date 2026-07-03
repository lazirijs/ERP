import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { LanguagesCode } from "@/translate/type";
import { loadMessages, locale as dxLocale } from "devextreme/localization";
import { languages } from "@/translate/constants";
import i18n from "@/translate";

export default defineStore("app", () => {
  const app = ref<string>(import.meta.env.VITE_APP_NAME);
  const isMobile = ref<boolean>(window.innerWidth < 768);
  const selectedLocale = computed(() => languages[i18n.global.locale.value as LanguagesCode]);

  const changeValue = (value: string) => {
    app.value = value;
  };

  const setLanguage = (code: LanguagesCode) => {
    i18n.global.locale.value = code;
    loadMessages(languages[code].locale.devextreme);
    dxLocale(code);
    localStorage.setItem("locale", code);
  };

  return { app, isMobile, selectedLocale, changeValue, setLanguage };
});