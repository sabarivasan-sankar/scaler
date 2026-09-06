import { describe, test, expect, afterEach } from "bun:test";
import Node from "./node";

describe("Node", () => {
  const backends: ReturnType<typeof Bun.serve>[] = [];

  afterEach(() => {
    while (backends.length) backends.pop()!.stop(true);
  });

  function startBackend(fetch: (req: Request) => Response) {
    const backend = Bun.serve({ port: 0, fetch });
    backends.push(backend);
    return backend;
  }

  test("checkHealth marks the node healthy when the health endpoint responds ok", async () => {
    const backend = startBackend(() => new Response("ok"));
    const node = new Node({ url: `http://localhost:${backend.port}`, healthEndpoint: "/health" });

    const result = await node.checkHealth();

    expect(result).toBe(true);
    expect(node.isHealthy).toBe(true);
  });

  test("checkHealth marks the node unhealthy when the health endpoint returns an error status", async () => {
    const backend = startBackend(() => new Response("error", { status: 500 }));
    const node = new Node({ url: `http://localhost:${backend.port}`, healthEndpoint: "/health" });

    const result = await node.checkHealth();

    expect(result).toBe(false);
    expect(node.isHealthy).toBe(false);
  });

  test("checkHealth marks the node unhealthy when the backend is unreachable", async () => {
    const node = new Node({ url: "http://localhost:1", healthEndpoint: "/health" });

    const result = await node.checkHealth();

    expect(result).toBe(false);
    expect(node.isHealthy).toBe(false);
  });

  test("forwardRequest proxies method, headers and body to the backend", async () => {
    // Node's constructor also fires a background /health check against this same
    // backend concurrently with the request below, so rather than capturing the
    // request into an outer variable (racy - either request could "win"), echo
    // what the backend saw back in the response body, which is unambiguously
    // tied to this specific forwardRequest call via its own resolved promise.
    const backend = startBackend((req) => {
      if (new URL(req.url).pathname === "/health") {
        return new Response("ok");
      }
      return new Response(
        JSON.stringify({
          xTest: req.headers.get("x-test"),
          xForwardedFor: req.headers.get("x-forwarded-for"),
          host: req.headers.get("host"),
        }),
        { status: 201 },
      );
    });
    const node = new Node({ url: `http://localhost:${backend.port}`, healthEndpoint: "/health" });

    const clientRequest = new Request("http://loadbalancer.local/some/path", {
      method: "POST",
      headers: { "X-Test": "abc" },
      body: "hello",
    });

    const response = await node.forwardRequest(clientRequest, "1.2.3.4");
    const payload = (await response.json()) as {
      xTest: string | null;
      xForwardedFor: string | null;
      host: string | null;
    };

    expect(response.status).toBe(201);
    expect(payload.xTest).toBe("abc");
    expect(payload.xForwardedFor).toBe("1.2.3.4");
    expect(payload.host).toBe(`localhost:${backend.port}`);
  });
});
