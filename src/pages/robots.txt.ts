import { site } from "../data/site";
export function GET() {
  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`,
    { headers: { "Content-Type": "text/plain" } },
  );
}
