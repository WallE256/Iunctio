
import { Dataset } from "@/scripts/globalstorage";

export function dateIsBetween(date: string, timeRange: [string, string]): boolean {
  const d = new Date(date);
  return d >= new Date(timeRange[0]) && d <= new Date(timeRange[1]);
}

export function findMinMaxDates(dataset: Dataset): [Date, Date] {
  let min = "9999-12-31";
  let max = "1000-01-01";
  const graph = dataset.graph;
  const sortedEdges = dataset.getSortedEdges();
  graph.forEachNode((node: string) => {
    const list = sortedEdges.get(node);
    // only have to look at the first and the last one
    if (list && list.length > 0) {
      const firstDate = graph.getEdgeAttribute(list[0], "date");
      if (firstDate < min) min = firstDate;

      const lastDate = graph.getEdgeAttribute(list[list.length - 1], "date");
      if (lastDate > max) max = lastDate;
    }
  });
  return [new Date(min), new Date(max)];
}
