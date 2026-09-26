export const shops = ["yokohama", "kawasaki"] as const;
export const topics = [
  "questions",
  "feedback",
  "private-reservation",
  "other",
] as const;
export const limits = { name: 100, email: 254, message: 5000 } as const;
export type Shop = (typeof shops)[number];
export type Topic = (typeof topics)[number];
export type Field = "name" | "email" | "shop" | "topic" | "message";
export interface Submission {
  name: string;
  email: string;
  shop: Shop;
  topic: Topic;
  message: string;
  website: string;
  token: string;
}
const controls = /[\u0000-\u001f\u007f-\u009f]/;
export function validEmail(value: string): boolean {
  return (
    value.length <= limits.email &&
    !controls.test(value) &&
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(
      value,
    ) &&
    !value.startsWith(".") &&
    !value.includes("..") &&
    !value.includes(".@")
  );
}
export function validate(input: unknown): {
  value?: Submission;
  errors: Field[];
} {
  const errors: Field[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { errors };
  const data = input as Record<string, unknown>;
  const keys = [
    "name",
    "email",
    "shop",
    "topic",
    "message",
    "website",
    "token",
  ];
  if (
    Object.keys(data).some((k) => !keys.includes(k)) ||
    keys.some((k) => typeof data[k] !== "string")
  )
    return { errors };
  const raw = data as unknown as Submission;
  const value = {
    ...raw,
    name: raw.name.trim(),
    email: raw.email.trim(),
    message: raw.message.trim(),
  };
  if (!value.name || value.name.length > limits.name || controls.test(raw.name))
    errors.push("name");
  if (!validEmail(value.email) || controls.test(raw.email))
    errors.push("email");
  if (!shops.includes(value.shop)) errors.push("shop");
  if (!topics.includes(value.topic)) errors.push("topic");
  if (!value.message || value.message.length > limits.message)
    errors.push("message");
  if (errors.length || raw.website.length > 200 || raw.token.length > 2048)
    return { errors };
  return { value, errors };
}
