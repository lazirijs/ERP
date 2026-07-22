/* eslint-disable prettier/prettier */
import { createI18n } from "vue-i18n";
import ar from "@/translate/languages/ar.json";
import en from "@/translate/languages/en.json";
import fr from "@/translate/languages/fr.json";
import de from "@/translate/languages/de.json";

const i18n = createI18n({
  legacy: false,
  locale: localStorage.locale || "de",
  globalInjection: true,
  messages: { en, ar, fr, de },
});

export const t = i18n.global.t;

export default i18n;