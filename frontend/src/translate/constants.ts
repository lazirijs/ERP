import type { LanguagesCode, LanguagesApps, RawLanguage, Languages } from "./type";

const appsLocals: Record<LanguagesCode, Record<LanguagesApps, unknown>> = {
  en: {
    app: (await import("@/translate/languages/en.json")).default,
    devextreme: (await import("devextreme/localization/messages/en.json")).default,
    elementPlus: (await import("element-plus/es/locale/lang/en")).default,
  },
  ar: {
    app: (await import("@/translate/languages/ar.json")).default,
    devextreme: (await import("devextreme/localization/messages/ar.json")).default,
    elementPlus: (await import("element-plus/es/locale/lang/ar")).default,
  },
  fr: {
    app: (await import("@/translate/languages/fr.json")).default,
    devextreme: (await import("devextreme/localization/messages/fr.json")).default,
    elementPlus: (await import("element-plus/es/locale/lang/fr")).default,
  }
};

export const rawLanguages: Record<LanguagesCode, RawLanguage> = {
  en: { name: "english", label: 'English', dir: 'ltr' },
  ar: { name: "arabic", label: 'العربية', dir: 'rtl' },
  fr: { name: "french", label: 'Français', dir: 'ltr' }
};

export const languages = (Object.keys(rawLanguages) as LanguagesCode[]).reduce((acc, key) => {
  acc[key] = {
    code: key,
    name: rawLanguages[key].name,
    label: rawLanguages[key].label,
    dir: rawLanguages[key].dir,
    locale: appsLocals[key]
  };
  return acc;
}, {} as Languages);