import type Node from "../node";

function weighted(nodes: Node[]) {
    if (nodes.length === 0) {
        return null;
    }

    const healthyNodes = nodes.filter((node) => node.isHealthy);
    


    let nodeWithLeastRequests = healthyNodes[0];

    if (!nodeWithLeastRequests) {
        return null;
    }

    for (const node of healthyNodes) {
        if (node.requestCount < nodeWithLeastRequests.requestCount) {
            nodeWithLeastRequests = node;
        }
    }

    return nodeWithLeastRequests;
}

export default weighted;