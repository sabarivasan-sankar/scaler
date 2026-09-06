const servers = [3001, 3002, 3003, 3004, 3005];

servers.forEach((port) => {
  const server = Bun.serve({
    port,
    fetch: async (request) => {
      console.log(`[${port}] ${request.url}`);
      return new Response(`OK from server ${port}`, {
        headers: { "X-Server-Port": String(port) },
      });
    },
  });
});
