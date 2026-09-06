import { fetch, type BunRequest } from "bun";

type NodeConfig = {
  url: string;
  healthEndpoint: string;
};

class Node {
  protected url: string;
  protected healthEndPoint: string;
  public isHealthy: boolean;
  constructor(config: NodeConfig) {
    this.url = config.url;
    this.isHealthy = true;
    this.healthEndPoint = config.healthEndpoint;

    // initialize node maintenance
    this.monitorHealth();
  }

  async checkHealth() {
    try {
      const response = await fetch(this.url + this.healthEndPoint);
      if (!response.ok) {
        throw new Error("Heath Failed");
      }
      this.isHealthy = true;
      return true;
    } catch (error) {
      this.isHealthy = false;
      return false;
    }
  }

  async monitorHealth() {
    await this.checkHealth();
    setTimeout(this.monitorHealth.bind(this), 1000);
  }

  forwardRequest(req: Request, clientIp: string) {
    const url = new URL(req.url);

    const headers = new Headers(req.headers);
    headers.set("X-Forwarded-For", clientIp);
    headers.set("Host", new URL(this.url).host);

    return fetch(this.url + url.pathname, {
      method: req.method,
      headers,
      body: req.body,
      redirect: "manual",
    });
  }
}

export default Node;
