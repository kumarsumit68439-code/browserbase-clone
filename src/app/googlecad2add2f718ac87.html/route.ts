export const dynamic = "force-static";

export function GET() {
  return new Response("google-site-verification: googlecad2add2f718ac87.html\n", {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
