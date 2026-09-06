import type Node from "../node";

let lastForwardedIndex = 0;

function roundRobin(nodes: Node[]) {
  if (nodes.length === 0) {
    return null;
  }

  const startIndex = (lastForwardedIndex + 1) % nodes.length;
  for (let offset = 0; offset < nodes.length; offset++) {
    const i = (startIndex + offset) % nodes.length;
    if (nodes[i]?.isHealthy) {
      lastForwardedIndex = i;
      return nodes[i];
    }
  }
  return null;
}

export default roundRobin;
