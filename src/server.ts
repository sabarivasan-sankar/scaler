import roundRobin from "./methods/round-robin";
import Node from "./node";

export type ServerConfig = {
  port: number;
  servers: { url: string; healthEndpoint: string }[];
};

export function startServer(config: ServerConfig) {
  if (!config.servers || config.servers.length <= 0) {
    throw new Error("No nodes registered");
  }

  const nodes = config.servers.map((server) => new Node(server));

  const server = Bun.serve({
    port: config.port,
    fetch: async (req: Request) => {
      const nodeToCall = roundRobin(nodes);
      if (!nodeToCall) {
        return new Response("No healthy servers found", { status: 504 });
      }
      const clientIp: string = server.requestIP(req)?.address || "Unknown";
      return await nodeToCall.forwardRequest(req, clientIp);
    },
  });

  return server;
}
