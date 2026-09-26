import { t, type Language } from "../i18n";
import { validate, type Field } from "./schema";
type WidgetOptions = {
  sitekey: string;
  action: string;
  language: Language;
  size: "compact";
  callback(token: string): void;
  "expired-callback"(): void;
  "error-callback"(): void;
};
type Turnstile = {
  render(node: HTMLElement, options: WidgetOptions): string;
  remove(id: string): void;
  reset(id: string): void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
let scriptPromise: Promise<Turnstile> | undefined;
function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(fail, 15000);
    function fail() {
      clearTimeout(timeout);
      script.remove();
      scriptPromise = undefined;
      reject(new Error("verification"));
    }
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timeout);
      if (window.turnstile) resolve(window.turnstile);
      else fail();
    };
    document.head.append(script);
  });
  return scriptPromise;
}
for (const form of document.querySelectorAll<HTMLFormElement>(
  "[data-contact]",
)) {
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const retry = form.querySelector<HTMLButtonElement>("[data-retry]")!;
  const status = form.querySelector<HTMLElement>("[data-contact-status]")!;
  const container = form.querySelector<HTMLElement>("[data-turnstile]")!;
  let token = "",
    widget: string | undefined,
    api: Turnstile | undefined;
  let busy = false,
    loading = false,
    activated = false,
    generation = 0;
  let statusKey = form.dataset.siteKey ? "initial" : "unavailable";
  let errors: Field[] = [];
  const language = (): Language =>
    document.documentElement.lang === "ja" ? "ja" : "en";
  function render() {
    status.removeAttribute("data-i18n");
    status.textContent = t(`form.status.${statusKey}`, language());
    submit.disabled = busy || !token;
    container.hidden =
      statusKey === "unavailable" || (!loading && widget === undefined);
    retry.hidden =
      !form.dataset.siteKey ||
      busy ||
      (!activated && statusKey !== "unavailable");
    for (const field of [
      "name",
      "email",
      "shop",
      "topic",
      "message",
    ] as const) {
      const control = form.elements.namedItem(field) as HTMLInputElement;
      const error = form.querySelector<HTMLElement>(`[data-error="${field}"]`);
      control.setAttribute("aria-invalid", String(errors.includes(field)));
      if (error)
        error.textContent = errors.includes(field)
          ? t(`form.errors.${field}`, language())
          : "";
    }
  }
  async function activate(force = false, preserveStatus = false) {
    if (
      !form.dataset.siteKey ||
      busy ||
      loading ||
      (widget !== undefined && !force)
    )
      return;
    activated = true;
    loading = true;
    token = "";
    const current = ++generation;
    if (!preserveStatus) statusKey = "verifying";
    render();
    try {
      api = await loadTurnstile();
      if (current !== generation) return;
      if (widget !== undefined) api.remove(widget);
      widget = api.render(container, {
        sitekey: form.dataset.siteKey,
        action: "contact",
        language: language(),
        size: "compact",
        callback(value) {
          if (current !== generation) return;
          token = value;
          if (!busy && !preserveStatus) statusKey = "ready";
          render();
        },
        "expired-callback"() {
          if (current !== generation) return;
          token = "";
          if (!busy) statusKey = "expired";
          render();
        },
        "error-callback"() {
          if (current !== generation) return;
          token = "";
          if (!busy) statusKey = "unavailable";
          render();
        },
      });
    } catch {
      if (current === generation) {
        statusKey = "unavailable";
        token = "";
      }
    } finally {
      if (current === generation) {
        loading = false;
        render();
      }
    }
  }
  form.noValidate = true;
  render();
  form.addEventListener("focusin", () => {
    if (!activated) void activate();
  });
  form.addEventListener("pointerdown", () => {
    if (!activated) void activate();
  });
  retry.addEventListener("click", () => void activate(true));
  document.addEventListener("site:language-change", () => {
    const focus = document.activeElement as HTMLElement | null;
    token = "";
    generation++;
    loading = false;
    if (widget !== undefined) {
      api?.remove(widget);
      widget = undefined;
    }
    render();
    if (activated && !busy)
      void activate(
        false,
        ["accepted", "delivery", "uncertain", "invalid"].includes(statusKey),
      );
    focus?.focus({ preventScroll: true });
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const input = Object.fromEntries(new FormData(form));
    // Turnstile's optional response input is not part of our wire contract.
    delete input["cf-turnstile-response"];
    const result = validate({ ...input, token });
    errors = result.errors;
    for (const field of [
      "name",
      "email",
      "shop",
      "topic",
      "message",
    ] as const) {
      const control = form.elements.namedItem(field) as HTMLInputElement;
      if (!control.validity.valid && !errors.includes(field))
        errors.push(field);
    }
    if (!result.value || errors.length) {
      statusKey = "invalid";
      render();
      (form.elements.namedItem(errors[0] || "name") as HTMLElement).focus();
      return;
    }
    if (!token) {
      statusKey = "verification";
      render();
      return;
    }
    busy = true;
    statusKey = "sending";
    render();
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.value),
        signal: AbortSignal.timeout(20000),
      });
      const body = (await response.json()) as { code?: string };
      if (response.ok && body.code === "accepted") {
        form.reset();
        errors = [];
        statusKey = "accepted";
      } else
        statusKey =
          body.code === "verification"
            ? "verification"
            : body.code === "invalid"
              ? "invalid"
              : "delivery";
    } catch {
      statusKey = "uncertain";
    } finally {
      token = "";
      busy = false;
      generation++;
      if (widget !== undefined) {
        api?.remove(widget);
        widget = undefined;
      }
      // Require explicit fresh verification; never retry a send automatically.
      render();
    }
  });
}
