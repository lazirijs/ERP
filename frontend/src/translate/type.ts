export type LanguagesCode = "en" | "ar" | "fr" | "de";

export type LanguagesApps = "app" | "devextreme" | "elementPlus";

export type RawLanguage = {
  name: string;
  label: string;
  dir: 'ltr' | 'rtl';
};

export type LanguagesRec = RawLanguage & {
  code: LanguagesCode;
  locale: Record<LanguagesApps, unknown>;
};

export type Languages = Record<LanguagesCode, LanguagesRec>;