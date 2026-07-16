import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { LanguagesCode } from "@/translate/type";
import { loadMessages, locale as dxLocale } from "devextreme/localization";
import { languages } from "@/translate/constants";
import i18n from "@/translate";

export default defineStore("app", () => {
  const isMobile = ref<boolean>(window.innerWidth < 768);
  const selectedLocale = computed(() => languages[i18n.global.locale.value as LanguagesCode]);

  window.addEventListener("resize", () => isMobile.value = window.innerWidth < 768);

  const setLanguage = (code: LanguagesCode) => {
    i18n.global.locale.value = code;
    loadMessages(languages[code].locale.devextreme);
    dxLocale(code);
    localStorage.setItem("locale", code);
  };

  return { isMobile, selectedLocale, setLanguage };
});