import { parse } from "yaml";
import { startServer, type ServerConfig } from "./src/server";

function getConfigPath(argv: string[]): string {
  const flagIndex = argv.indexOf("--config");
  if (flagIndex !== -1 && argv[flagIndex + 1]) {
    return argv[flagIndex + 1]!;
  }
  return "scaler.yml";
}

const configPath = getConfigPath(process.argv.slice(2));
const configFile = Bun.file(configPath);

if (!(await configFile.exists())) {
  throw new Error(`Config file not found: ${configPath}`);
}

const config = parse(await configFile.text()) as ServerConfig;

const server = startServer(config);

console.log(`Load balancer listening on port ${server.port} (config: ${configPath})`);
