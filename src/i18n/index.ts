import { createInstance } from "i18next";
import en from "./locales/en.json";
import ja from "./locales/ja.json";
import { addressParts } from "../data/addresses";
export const resources = { en: { translation: en }, ja: { translation: ja } };
export type Language = "en" | "ja";
export function createI18n() {
  const instance = createInstance();
  void instance.init({
    resources,
    lng: "en",
    fallbackLng: "en",
    supportedLngs: ["en", "ja"],
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  return instance;
}
export const i18n = createI18n();
export function t(key: string, language: Language = "en"): string {
  return i18n.t(key, {
    lng: language,
    ...(key.startsWith("address.")
      ? {
          address:
            addressParts[key.split(".")[1] as keyof typeof addressParts][
              language
            ],
        }
      : {}),
  });
}
