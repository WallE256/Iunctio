import Graph from "graphology";
import * as GlobalStorage from "@/scripts/globalstorage";

/// Parses the CSV file `file` describing a graph.
/// When done reading and parsing, it returns the
export function csvParse(
  file: File,
  id: string,
  onFinish: (graph: Graph) => void
): void {
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = async () => {
    const graph = processData(reader.result as string);
    // file name variable stores the name without the extension
    await GlobalStorage.addDataset(id, graph);
    onFinish(graph);
  };
}

function processData(data: string): Graph {
  const t0 = performance.now();
  const lines = data.split("\n");
  for (let i = 0; i < lines.length; i++) lines[i] = lines[i].trim();
  const options = lines[0].split(",");
  // console.log(options);
  // pop up for mapping options to node attributes or edge attributes
  // pop up for graph options
  const graph = new Graph({ multi: true, type: "directed" });
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].split(",");
    if (line.length != options.length) continue;
    graph.mergeNode(line[1], { email: line[2], jobtitle: line[3] });
    graph.mergeNode(line[4], { email: line[5], jobtitle: line[6] });
    graph.addDirectedEdge(line[1], line[4], {
      date: line[0],
      messageType: line[7],
      sentiment: line[8],
    });
  }
  // console.log(graph);
  const t1 = performance.now();
  console.log("Parsing took " + (t1 - t0) + " milliseconds.");

  // console.log(graph.export());
  return graph;
}
