export type CorsConfig = {
  enabled: boolean;
  origins?: string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
};

const DEFAULT_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const DEFAULT_HEADERS = ["Content-Type", "Authorization"];

export function buildCorsHeaders(req: Request, config: CorsConfig): Headers {
  const headers = new Headers();
  const origins = config.origins ?? ["*"];
  const requestOrigin = req.headers.get("Origin");

  let allowOrigin: string | null = null;
  if (origins.includes("*") && !config.credentials) {
    allowOrigin = "*";
  } else if (requestOrigin && origins.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
    headers.set("Vary", "Origin");
  }

  if (!allowOrigin) {
    return headers;
  }

  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Methods", (config.methods ?? DEFAULT_METHODS).join(", "));
  headers.set("Access-Control-Allow-Headers", (config.headers ?? DEFAULT_HEADERS).join(", "));
  if (config.credentials) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  return headers;
}
