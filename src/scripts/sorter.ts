import Graph from "graphology";

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
