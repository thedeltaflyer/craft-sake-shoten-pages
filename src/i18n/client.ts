import { i18n, t, type Language } from "./index";
const storageKey = "craft-sake-language";
function supported(value: string | null | undefined): Language | undefined {
  const primary = value?.toLowerCase().split("-")[0];
  return primary === "ja" || primary === "en" ? primary : undefined;
}
function saved(): Language | undefined {
  try {
    const value = localStorage.getItem(storageKey);
    return value === "en" || value === "ja" ? value : undefined;
  } catch {
    return;
  }
}
function save(language: Language) {
  try {
    localStorage.setItem(storageKey, language);
  } catch {
    /* Storage is optional. */
  }
}
function browserLanguage(): Language {
  const preferences = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const preference of preferences) {
    const language = supported(preference);
    if (language) return language;
  }
  return "en";
}
// Translations never control HTML, URLs, event handlers, or style attributes.
const attributes = ["alt", "aria-label", "title", "content"] as const;
function render(language: Language) {
  void i18n.changeLanguage(language);
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n!, language);
  });
  for (const attribute of attributes)
    document
      .querySelectorAll<HTMLElement>(`[data-i18n-${attribute}]`)
      .forEach((node) => {
        node.setAttribute(
          attribute,
          t(node.getAttribute(`data-i18n-${attribute}`)!, language),
        );
      });
  document.documentElement.lang = language;
  document
    .querySelectorAll<HTMLButtonElement>("[data-language]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.language === language),
      ),
    );
}
try {
  const url = new URL(location.href);
  const query = url.searchParams.get("lang")?.toLowerCase();
  const explicit =
    query === "jp" || query === "ja" ? "ja" : query === "en" ? "en" : undefined;
  render(explicit ?? saved() ?? browserLanguage());
  if (explicit) {
    save(explicit);
    url.searchParams.delete("lang");
    try {
      history.replaceState(
        history.state,
        "",
        url.pathname + url.search + url.hash,
      );
    } catch {
      /* Language still works without history access. */
    }
  }
  document
    .querySelectorAll<HTMLButtonElement>("[data-language]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        const language = button.dataset.language as Language;
        render(language);
        save(language);
      }),
    );
  document
    .querySelectorAll<HTMLElement>("[data-language-switcher]")
    .forEach((node) => (node.hidden = false));
} catch (error) {
  console.error(
    "Language initialization failed; English content remains available.",
    error,
  );
}
