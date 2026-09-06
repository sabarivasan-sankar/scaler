import type Node from "../node";

let lastForwardedIndex = 0;

function roundRobin(nodes: Node[]) {
  const startIndex = (lastForwardedIndex + 1) % nodes.length;
  for (
    let i = startIndex;
    i != lastForwardedIndex;
    i = (i + 1) % nodes.length
  ) {
    if (nodes[i]?.isHealthy) {
      lastForwardedIndex = i;
      return nodes[i];
    }
  }
  return null;
}

export default roundRobin;
