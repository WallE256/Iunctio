import Graph from "graphology";

const ctx: Worker = self as never;

ctx.addEventListener("message", (event) => {
  console.log(event);
  csvParse(event.data);
});

function csvParse(file: File): void {
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = () => {
    processData(reader.result as string);
  };
}

function processData(data: string): void {
  const t0 = performance.now();
  const lines = data.split("\n");
  for (let i = 0; i < lines.length; i++) lines[i] = lines[i].trim();
  const options = lines[0].split(",");
  console.log(options);
  // pop up for mapping options to node atributes or edge atributes
  // pop up for graph options
  const graph = new Graph({ multi: true, type: "directed" });
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].split(",");
    graph.mergeNode(line[1], { email: line[2], jobtitle: line[3] });
    graph.mergeNode(line[4], { email: line[5], jobtitle: line[6] });
    graph.addDirectedEdge(line[1], line[4], {
      date: line[0],
      messageType: line[7],
      sentiment: line[8],
    });
  }
  console.log(graph);
  const t1 = performance.now();
  console.log("Parsing took " + (t1 - t0) + " milliseconds.");
}
