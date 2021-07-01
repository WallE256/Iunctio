
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

/// `getMonthsDifference` returns the number of months between `startDate` and `offsetDate`
export function getMonthsDifference(startDate: Date, offsetDate: Date): number {
  return (offsetDate.getFullYear() - startDate.getFullYear()) * 12
  - startDate.getMonth() + offsetDate.getMonth();
}

/// `containsEdgeInRange` checks whether any of the edges between `source` and
/// `target` are in the given `timeRange`.
export function containsEdgeInRange(dataset: Dataset, source: string, target: string, timeRange: [string, string]): boolean {
  // TODO: this could probably be done faster by using this.sortedEdges
  let found = false;
  dataset.graph.forEachEdgeUntil(source, target, (edge, edgeAttributes: any) => {
    if (dateIsBetween(edgeAttributes.date, timeRange)) {
      found = true;
      return true; // break
    }
    return false;
  });
  return found;
}
