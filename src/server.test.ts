import { describe, test, expect, afterEach } from "bun:test";
import { startServer } from "./server";

describe("startServer", () => {
  let lb: ReturnType<typeof startServer> | undefined;
  const backends: ReturnType<typeof Bun.serve>[] = [];

  afterEach(() => {
    lb?.stop(true);
    while (backends.length) backends.pop()!.stop(true);
    lb = undefined;
  });

  function startBackend(label: string) {
    const backend = Bun.serve({ port: 0, fetch: () => new Response(label) });
    backends.push(backend);
    return { url: `http://localhost:${backend.port}`, healthEndpoint: "/health" };
  }

  test("throws when no servers are configured", () => {
    expect(() => startServer({ port: 0, servers: [] })).toThrow("No nodes registered");
  });

  test("round robins requests across the configured backends", async () => {
    const s1 = startBackend("one");
    const s2 = startBackend("two");
    lb = startServer({ port: 0, servers: [s1, s2] });

    const results: string[] = [];
    for (let i = 0; i < 4; i++) {
      results.push(await (await fetch(`http://localhost:${lb.port}/`)).text());
    }

    expect(new Set(results)).toEqual(new Set(["one", "two"]));
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).not.toBe(results[i - 1]);
    }
  });

  test("returns 504 once the only backend becomes unhealthy", async () => {
    lb = startServer({
      port: 0,
      servers: [{ url: "http://localhost:1", healthEndpoint: "/health" }],
    });

    const deadline = Date.now() + 3000;
    let status = 0;
    while (Date.now() < deadline) {
      status = (await fetch(`http://localhost:${lb.port}/`)).status;
      if (status === 504) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    expect(status).toBe(504);
  }, 5000);

  test("answers OPTIONS preflight directly without hitting a backend", async () => {
    const s1 = startBackend("one");
    lb = startServer({
      port: 0,
      servers: [s1],
      cors: { enabled: true, origins: ["http://allowed.com"] },
    });

    const response = await fetch(`http://localhost:${lb.port}/`, {
      method: "OPTIONS",
      headers: { Origin: "http://allowed.com" },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://allowed.com");
  });

  test("adds CORS headers to proxied responses when enabled", async () => {
    const s1 = startBackend("one");
    lb = startServer({
      port: 0,
      servers: [s1],
      cors: { enabled: true, origins: ["http://allowed.com"] },
    });

    const response = await fetch(`http://localhost:${lb.port}/`, {
      headers: { Origin: "http://allowed.com" },
    });

    expect(await response.text()).toBe("one");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://allowed.com");
  });

  test("does not add CORS headers when cors is not configured", async () => {
    const s1 = startBackend("one");
    lb = startServer({ port: 0, servers: [s1] });

    const response = await fetch(`http://localhost:${lb.port}/`, {
      headers: { Origin: "http://allowed.com" },
    });

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
