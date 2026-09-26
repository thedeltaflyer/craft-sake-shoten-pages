import { test } from "node:test";
import assert from "node:assert/strict";
import { handle, type Env, type Mail } from "../worker/index.ts";
const draft = {
  name: " 山田 太郎 ",
  email: "visitor@example.com",
  shop: "kawasaki",
  topic: "private-reservation",
  message: "  日本語の質問\nSecond line  ",
  website: "",
  token: "test-token",
};
function setup() {
  const sent: Mail[] = [];
  let verified = 0;
  const env: Env = {
    ASSETS: { fetch: async () => new Response("asset", { status: 404 }) },
    EMAIL: {
      send: async (mail) => {
        sent.push(mail);
      },
    },
    CONTACT_TO_EMAIL: "synthetic-private-recipient@example.com",
    CONTACT_FROM_EMAIL: "synthetic-sender@example.com",
    TURNSTILE_SECRET_KEY: "synthetic-turnstile-secret",
    CONTACT_ALLOWED_HOSTS: "example.com",
  };
  const verify: typeof fetch = async (_url, init) => {
    verified++;
    assert.equal(
      JSON.parse(String(init?.body)).secret,
      env.TURNSTILE_SECRET_KEY,
    );
    assert.ok(init?.signal);
    return Response.json({
      success: true,
      hostname: "example.com",
      action: "contact",
    });
  };
  return { env, sent, verify, calls: () => verified };
}
function request(body: unknown = draft, headers: Record<string, string> = {}) {
  return new Request("https://example.com/api/contact", {
    method: "POST",
    headers: {
      Origin: "https://example.com",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
test("valid Unicode inquiry sends once with private routing and safe headers", async () => {
  const s = setup();
  const response = await handle(request(), s.env, s.verify);
  assert.equal(response.status, 200);
  assert.equal(s.calls(), 1);
  assert.equal(s.sent.length, 1);
  assert.deepEqual(s.sent[0], {
    to: s.env.CONTACT_TO_EMAIL,
    from: { email: s.env.CONTACT_FROM_EMAIL, name: "Craft Sake Shoten" },
    replyTo: draft.email,
    subject: "Website inquiry: Kawasaki — Private Reservation",
    text: `Name: 山田 太郎\nEmail: ${draft.email}\nShop: Kawasaki\nTopic: Private Reservation\n\n日本語の質問\nSecond line`,
  });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-robots-tag"), "noindex");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(await response.text(), '{"code":"accepted"}');
});
test("honeypot returns acceptance without external calls", async () => {
  const s = setup();
  assert.equal(
    (
      await handle(
        request({ ...draft, website: "bot", token: "" }),
        s.env,
        s.verify,
      )
    ).status,
    200,
  );
  assert.equal(s.calls(), 0);
  assert.equal(s.sent.length, 0);
});
for (const [label, body] of Object.entries({
  array: [],
  null: null,
  unknown: { ...draft, to: "attacker@example.com" },
  type: { ...draft, name: 1 },
  missing: { name: "x" },
  blankName: { ...draft, name: " \n " },
  longName: { ...draft, name: "x".repeat(101) },
  headerName: { ...draft, name: "A\r\nBcc: bad" },
  headerEmail: { ...draft, email: "a@example.com\r\nBcc: bad" },
  emails: { ...draft, email: "a@example.com,b@example.com" },
  malformedEmail: { ...draft, email: "a..b@example.com" },
  longEmail: { ...draft, email: "x".repeat(250) + "@example.com" },
  blankMessage: { ...draft, message: " \n " },
  longMessage: { ...draft, message: "x".repeat(5001) },
  shop: { ...draft, shop: "forged" },
  topic: { ...draft, topic: "forged" },
  token: { ...draft, token: "" },
})) {
  test(`rejects ${label}`, async () => {
    const s = setup();
    const r = await handle(request(body), s.env, s.verify);
    assert.equal(r.status, 400);
    assert.equal(s.calls(), 0);
    assert.equal(s.sent.length, 0);
  });
}
test("method, content type, origins, missing config, malformed and bounded bodies", async () => {
  const s = setup();
  const get = await handle(
    new Request("https://example.com/api/contact"),
    s.env,
    s.verify,
  );
  assert.equal(get.status, 405);
  assert.equal(get.headers.get("allow"), "POST");
  for (const origin of [
    "",
    "null",
    "https://evil.example",
    "https://example.com.evil",
  ])
    assert.equal(
      (await handle(request(draft, { Origin: origin }), s.env, s.verify))
        .status,
      403,
    );
  assert.equal(
    (
      await handle(
        request(draft, { "Content-Type": "text/plain" }),
        s.env,
        s.verify,
      )
    ).status,
    415,
  );
  for (const key of [
    "CONTACT_TO_EMAIL",
    "CONTACT_FROM_EMAIL",
    "TURNSTILE_SECRET_KEY",
    "CONTACT_ALLOWED_HOSTS",
  ] as const)
    assert.equal(
      (await handle(request(), { ...s.env, [key]: "" }, s.verify)).status,
      503,
    );
  assert.equal(
    (
      await handle(
        request(),
        { ...s.env, CONTACT_ALLOWED_HOSTS: "other.example.com" },
        s.verify,
      )
    ).status,
    403,
  );
  const malformed = request();
  await malformed.text();
  assert.equal(
    (await handle(new Request(malformed, { body: "{" }), s.env, s.verify))
      .status,
    400,
  );
  assert.equal(
    (
      await handle(
        request(draft, { "Content-Length": "32769" }),
        s.env,
        s.verify,
      )
    ).status,
    413,
  );
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode("x".repeat(20000)));
      c.enqueue(new TextEncoder().encode("x".repeat(20000)));
      c.close();
    },
  });
  const oversized = new Request("https://example.com/api/contact", {
    method: "POST",
    headers: {
      Origin: "https://example.com",
      "Content-Type": "application/json",
    },
    body: stream,
    duplex: "half",
  } as RequestInit);
  assert.equal((await handle(oversized, s.env, s.verify)).status, 413);
  assert.equal(s.calls(), 0);
  assert.equal(s.sent.length, 0);
});
for (const result of [
  { success: false, "error-codes": ["timeout-or-duplicate"] },
  { success: true, hostname: "evil.example", action: "contact" },
  { success: true, hostname: "example.com", action: "login" },
  {},
]) {
  test(`rejects Siteverify ${JSON.stringify(result)}`, async () => {
    const s = setup();
    assert.equal(
      (await handle(request(), s.env, async () => Response.json(result)))
        .status,
      400,
    );
    assert.equal(s.sent.length, 0);
  });
}
test("upstream and email errors never leak secrets; no automatic retry", async () => {
  const s = setup();
  for (const verify of [
    async () => {
      throw new Error(s.env.TURNSTILE_SECRET_KEY);
    },
    async () => new Response("broken"),
    async () => Response.json({ success: true }, { status: 500 }),
  ]) {
    const r = await handle(request(), s.env, verify);
    assert.ok(r.status >= 400);
    assert.doesNotMatch(await r.text(), /synthetic/);
  }
  assert.equal(s.sent.length, 0);
  let sends = 0;
  s.env.EMAIL.send = async () => {
    sends++;
    throw new Error(s.env.CONTACT_TO_EMAIL);
  };
  const r = await handle(request(), s.env, s.verify);
  assert.equal(r.status, 502);
  assert.equal(sends, 1);
  assert.equal(await r.text(), '{"code":"delivery"}');
});
test("expired/replayed token sends no email on second request", async () => {
  const s = setup();
  let count = 0;
  const verify: typeof fetch = async () =>
    Response.json(
      ++count === 1
        ? { success: true, hostname: "example.com", action: "contact" }
        : { success: false, "error-codes": ["timeout-or-duplicate"] },
    );
  await handle(request(), s.env, verify);
  assert.equal((await handle(request(), s.env, verify)).status, 400);
  assert.equal(s.sent.length, 1);
});
test("all other paths delegate to static assets", async () => {
  const s = setup();
  for (const path of ["/", "/missing", "/api/contact/", "/api/other"]) {
    const r = await handle(
      new Request(`https://example.com${path}`),
      s.env,
      s.verify,
    );
    assert.equal(await r.text(), "asset");
  }
});
