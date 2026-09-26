import { validate, validEmail } from "../src/contact/schema.ts";
export interface Mail {
  to: string;
  from: { email: string; name: string };
  replyTo: string;
  subject: string;
  text: string;
}
export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  EMAIL: { send(message: Mail): Promise<unknown> };
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
  TURNSTILE_SECRET_KEY: string;
  CONTACT_ALLOWED_HOSTS: string;
}
const maxBody = 32 * 1024;
function response(
  status: number,
  code: string,
  extra: Record<string, string> = {},
) {
  return new Response(JSON.stringify({ code }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
      ...extra,
    },
  });
}
async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("Content-Length")) > maxBody) throw 413;
  const reader = request.body?.getReader();
  if (!reader) throw 400;
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBody) {
        await reader.cancel();
        throw 413;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
export async function handle(
  request: Request,
  env: Env,
  verifyFetch: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/contact") return env.ASSETS.fetch(request);
  if (request.method !== "POST")
    return response(405, "method", { Allow: "POST" });
  if (
    !env.CONTACT_ALLOWED_HOSTS ||
    !env.TURNSTILE_SECRET_KEY ||
    !validEmail(env.CONTACT_TO_EMAIL || "") ||
    !validEmail(env.CONTACT_FROM_EMAIL || "") ||
    !env.EMAIL?.send
  )
    return response(503, "unavailable");
  if (
    request.headers.get("Origin") !== url.origin ||
    !env.CONTACT_ALLOWED_HOSTS.split(",")
      .map((h) => h.trim())
      .includes(url.host)
  )
    return response(403, "origin");
  if (
    request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return response(415, "media");
  let input: unknown;
  try {
    input = await readBody(request);
  } catch (error) {
    return response(
      error === 413 ? 413 : 400,
      error === 413 ? "size" : "invalid",
    );
  }
  const { value } = validate(input);
  if (!value) return response(400, "invalid");
  if (value.website) return response(200, "accepted");
  if (!value.token) return response(400, "verification");
  try {
    const result = await verifyFetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: value.token,
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    const verification = (await result.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
    };
    if (
      !result.ok ||
      verification.success !== true ||
      verification.hostname !== url.hostname ||
      verification.action !== "contact"
    )
      return response(400, "verification");
  } catch {
    return response(503, "verification");
  }
  const shop = value.shop === "yokohama" ? "Yokohama" : "Kawasaki";
  const topic = {
    questions: "Questions",
    feedback: "Feedback",
    "private-reservation": "Private Reservation",
    other: "Other",
  }[value.topic];
  try {
    await env.EMAIL.send({
      to: env.CONTACT_TO_EMAIL,
      from: { email: env.CONTACT_FROM_EMAIL, name: "Craft Sake Shoten" },
      replyTo: value.email,
      subject: `Website inquiry: ${shop} — ${topic}`,
      text: `Name: ${value.name}\nEmail: ${value.email}\nShop: ${shop}\nTopic: ${topic}\n\n${value.message}`,
    });
  } catch {
    return response(502, "delivery");
  }
  return response(200, "accepted");
}
export default { fetch: (request: Request, env: Env) => handle(request, env) };
