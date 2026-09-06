# Load Balancer

A simple load balancer built with Bun and TypeScript.

## Install

```bash
bun install
```

## Run

```bash
bun run index.ts
```

By default this loads `scaler.yml` from the current directory. To use a different config file, pass `--config`:

```bash
bun run index.ts --config path/to/my-config.yml
```

## Config file

The config file is YAML with two top-level keys:

- `port` — the port the load balancer listens on.
- `servers` — a list of backend servers to balance across. Each entry has:
  - `url` — the base URL of the backend (e.g. `http://localhost:3001`).
  - `healthEndpoint` — the path checked periodically to decide if the server is healthy.

Example (`scaler.yml`):

```yaml
port: 3000
servers:
  - url: http://localhost:3001
    healthEndpoint: /health
  - url: http://localhost:3002
    healthEndpoint: /health
```

## Dev setup

`pullup/index.ts` spins up 5 dummy backend servers on ports 3001-3005, matching the default `scaler.yml`. Use it to test the load balancer locally:

```bash
bun run pullup       # start dummy backend servers
bun run index.ts     # start the load balancer in another terminal
```

This project uses [Bun](https://bun.com), a fast all-in-one JavaScript runtime.
