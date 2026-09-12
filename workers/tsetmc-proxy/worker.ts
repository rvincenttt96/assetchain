/**
 * TSETMC-only reverse proxy, adapted from Andromeda-Collective/andro-cfw.
 *
 * The original worker is a pass-through to api.telegram.org. This copy keeps
 * the same Cloudflare Worker reverse-proxy shape, but only forwards GET
 * ClosingPrice requests to cdn.tsetmc.com so the rest of the site never
 * depends on this hop.
 */

export interface Env {
  PROXY_SECRET?: string;
}

const TSETMC_ORIGIN = "https://cdn.tsetmc.com";
const ALLOWED_PATH = /^\/api\/ClosingPrice\/GetClosingPriceInfo\/\d+$/;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Proxy-Key"
};

function unauthorized(): Response {
  return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}

function forbidden(): Response {
  return new Response(JSON.stringify({ ok: false, error: "Path not allowed" }), {
    status: 403,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/" || url.pathname === "") {
      return new Response("andro-cfw tsetmc proxy is running.", {
        status: 200,
        headers: { "Content-Type": "text/plain", ...CORS_HEADERS }
      });
    }

    if (request.method !== "GET") {
      return forbidden();
    }

    if (!ALLOWED_PATH.test(url.pathname)) {
      return forbidden();
    }

    if (env.PROXY_SECRET) {
      const headerAuth = request.headers.get("Authorization") ?? "";
      const headerKey = request.headers.get("X-Proxy-Key") ?? "";
      const token = headerAuth.startsWith("Bearer ")
        ? headerAuth.slice("Bearer ".length)
        : headerKey;

      if (token !== env.PROXY_SECRET) {
        return unauthorized();
      }
    }

    try {
      const upstreamResponse = await fetch(`${TSETMC_ORIGIN}${url.pathname}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          origin: "https://www.tsetmc.com",
          referer: "https://www.tsetmc.com/",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
      });

      const responseHeaders = new Headers(upstreamResponse.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("X-Content-Type-Options", "nosniff");
      responseHeaders.set("Cache-Control", "public, max-age=15");

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders
      });
    } catch (proxyErr) {
      console.error("TSETMC proxy error:", proxyErr);
      return new Response(
        JSON.stringify({
          ok: false,
          error_code: 502,
          description: "Bad Gateway via andro-cfw TSETMC proxy"
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS }
        }
      );
    }
  }
};
