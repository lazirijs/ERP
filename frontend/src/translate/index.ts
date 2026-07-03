/* eslint-disable prettier/prettier */
import { createI18n } from "vue-i18n";
import fr from "@/translate/languages/fr.json";
import en from "@/translate/languages/en.json";
import ar from "@/translate/languages/ar.json";

const i18n = createI18n({
  legacy: false,
  locale: localStorage.locale || "fr",
  globalInjection: true,
  messages: { fr, en, ar },
});

export default i18n;