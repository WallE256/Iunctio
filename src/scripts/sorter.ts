import Graph from "graphology";

export function sortEdgesByDate(graph: Graph): Map<string, string[]> {
  const sorted = new Map();
  for (const [node, attributes] of graph.nodeEntries()) {
    const edges = graph.edges(node);
    edges.sort(function (a, b) {
      const dateA = graph.getEdgeAttribute(a, "date");
      const dateB = graph.getEdgeAttribute(b, "date");
      if (dateA < dateB) return -1;
      else if (dateA == dateB) return 0;
      else return 1;
    });
    sorted.set(node, edges);
  }
  return sorted;
}

export function sortNodesByCommunity(graph: Graph): string[] {
  const result = graph.nodes();
  result.sort(function (a, b) {
    const communityA = graph.getNodeAttribute(a, "community");
    const communityB = graph.getNodeAttribute(b, "community");
    if (communityA < communityB) return -1;
    else if (communityA == communityB) return 0;
    else return 1;
  });
  return result;
}
