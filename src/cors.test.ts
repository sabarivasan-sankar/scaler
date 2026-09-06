import { describe, test, expect } from "bun:test";
import { buildCorsHeaders, type CorsConfig } from "./cors";

function requestFrom(origin?: string): Request {
  const headers: Record<string, string> = {};
  if (origin) headers.Origin = origin;
  return new Request("http://localhost/foo", { headers });
}

describe("buildCorsHeaders", () => {
  test("wildcard origin without credentials allows any origin via *", () => {
    const headers = buildCorsHeaders(requestFrom("http://example.com"), { enabled: true });

    expect(headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, PATCH, DELETE, OPTIONS");
    expect(headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization");
    expect(headers.get("Access-Control-Allow-Credentials")).toBeNull();
  });

  test("an origin on the allowlist is echoed back with a Vary header", () => {
    const config: CorsConfig = { enabled: true, origins: ["http://allowed.com"] };
    const headers = buildCorsHeaders(requestFrom("http://allowed.com"), config);

    expect(headers.get("Access-Control-Allow-Origin")).toBe("http://allowed.com");
    expect(headers.get("Vary")).toBe("Origin");
  });

  test("an origin not on the allowlist gets no CORS headers", () => {
    const config: CorsConfig = { enabled: true, origins: ["http://allowed.com"] };
    const headers = buildCorsHeaders(requestFrom("http://evil.com"), config);

    expect(headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  test("a request with no Origin header against an allowlist gets no CORS headers", () => {
    const config: CorsConfig = { enabled: true, origins: ["http://allowed.com"] };
    const headers = buildCorsHeaders(requestFrom(), config);

    expect(headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  test("credentials true sets Access-Control-Allow-Credentials", () => {
    const config: CorsConfig = { enabled: true, origins: ["http://allowed.com"], credentials: true };
    const headers = buildCorsHeaders(requestFrom("http://allowed.com"), config);

    expect(headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  test("custom methods and headers override the defaults", () => {
    const config: CorsConfig = {
      enabled: true,
      origins: ["*"],
      methods: ["GET"],
      headers: ["X-Custom"],
    };
    const headers = buildCorsHeaders(requestFrom("http://example.com"), config);

    expect(headers.get("Access-Control-Allow-Methods")).toBe("GET");
    expect(headers.get("Access-Control-Allow-Headers")).toBe("X-Custom");
  });

  test("empty origins list denies every origin", () => {
    const config: CorsConfig = { enabled: true, origins: [] };
    const headers = buildCorsHeaders(requestFrom("http://example.com"), config);

    expect(headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
