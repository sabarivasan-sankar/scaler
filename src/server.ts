import roundRobin from "./methods/round-robin";
import Node from "./node";
import { buildCorsHeaders, type CorsConfig } from "./cors";

export type ServerConfig = {
  port: number;
  servers: { url: string; healthEndpoint: string }[];
  cors?: CorsConfig;
};

export function startServer(config: ServerConfig) {
  if (!config.servers || config.servers.length <= 0) {
    throw new Error("No nodes registered");
  }

  const nodes = config.servers.map((server) => new Node(server));

  const server = Bun.serve({
    port: config.port,
    fetch: async (req: Request) => {
      const cors = config.cors?.enabled ? buildCorsHeaders(req, config.cors) : null;

      if (cors && req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors });
      }

      const nodeToCall = roundRobin(nodes);
      if (!nodeToCall) {
        return new Response("No healthy servers found", { status: 504, headers: cors ?? undefined });
      }
      const clientIp: string = server.requestIP(req)?.address || "Unknown";
      const response = await nodeToCall.forwardRequest(req, clientIp);

      if (!cors) {
        return response;
      }

      const headers = new Headers(response.headers);
      cors.forEach((value, key) => headers.set(key, value));
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    },
  });

  return server;
}
