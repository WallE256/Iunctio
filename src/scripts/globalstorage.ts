// use as follows:
// import * as GlobalStorage from "@/scripts/globalstorage";
// the Visualise.vue page should use these functions to manage the
// uploaded datasets and the created visualizations/diagrams.

import Graph from "graphology";
import localforage from "localforage";

export class Diagram {
  /// This diagram's unique identifier
  id: string;

  /// The graph that this diagram is drawing (the id refers to the graph's
  /// unique id, which can be used in `getDataset()`).
  graphID: string;

  /// The visualization type.
  /// Possible options: arcdiagram, sunburst.
  type: string;

  /// Any additional settings that are associated with this diagram.
  /// What settings are stored depends on `this.type`.
  /// To change a setting, use `changeSetting()` and don't use this property
  /// directly.
  settings: any;

  /// The change listener, which is called when a setting is changed using
  /// `changeSetting()`.
  onChange?: (diagram: Diagram, changedKey: string) => void;

  ///
  constructor(
    id: string,
    graphID: string,
    type: string,
    settings?: any,
    onChange?: (diagram: Diagram, changedKey: string) => void
  ) {
    this.id = id;
    this.graphID = graphID;
    this.type = type;
    if (settings) {
      this.settings = settings;
    } else {
      this.settings = {};
    }
    this.onChange = onChange;
  }
}

const diagrams = new Map<string, Diagram>();
const selectedNode = null as {
  datasetID: string;
  nodeID: any;
} | null;
const datasets = new Map<string, Graph>();

function diagramToJSON(diagram: Diagram): string {
  // unfortunately this function is necessary, or it will try to serialize the
  // onChange field as well
  return `{
    "id": ${JSON.stringify(diagram.id)},
    "graphID": ${JSON.stringify(diagram.graphID)},
    "type": ${JSON.stringify(diagram.type)},
    "settings": ${JSON.stringify(diagram.settings)}
  }`;
}

/// `addDataset` adds a dataset to the global storage
export function addDataset(id: string, graph: Graph): void {
  datasets.set(id, graph);
  const storageKey = "dataset-" + id;
  localforage.setItem(storageKey, JSON.stringify(graph.export()));
}

/// `getDataset` returns the graph that corresponds to the given id, or
/// `null` if it does not exist.
/// It will be fetched from memory, or localStorage if that is not available.
export async function getDataset(id: string): Promise<Graph | null> {
  // if it's in the memory, use that (so parsing JSON is not necessary)
  const inMemory = datasets.get(id);
  if (inMemory) {
    return inMemory;
  }

  // otherwise, look for the dataset in localStorage
  try {
    const storageKey = "dataset-" + id;
    const storageItem = (await localforage.getItem(storageKey)) as string;
    const graph = Graph.from(JSON.parse(storageItem));
    datasets.set(id, graph);
    return graph;
  } catch (error) {
    console.log(error);
    return null;
  }

  return null;
}

/// `removeDataset` deletes a dataset from the memory AND from the local storage.
export function removeDataset(id: string): void {
  datasets.delete(id);
  const storageKey = "dataset-" + id;
  localforage.removeItem(storageKey);
}

/// `addDiagram` will add a new diagram to local storage.
export function addDiagram(diagram: Diagram): void {
  const storageKey = "dia-" + diagram.id;
  localforage.setItem(storageKey, diagramToJSON(diagram));
  diagrams.set(diagram.id, diagram);
}

/// `getDiagram` returns a Diagram's settings and properties if a diagram
/// exists with the key `id`, or `null` if it does not exist.
/// It will look in the in-memory storage, and in the local storage if that
/// is not available.
export async function getDiagram(id: string): Promise<Diagram | null> {
  // first try it in memory so deserialization is not necessary
  const inMemory = diagrams.get(id);
  if (inMemory) {
    return inMemory;
  }

  // otherwise, try to get it from localStorage
  try {
    const storageKey = "dia-" + id;
    const storageItem = (await localforage.getItem(storageKey)) as string;
    const deserialized = JSON.parse(storageItem);
    const diagram = new Diagram(
      deserialized.id,
      deserialized.graphID,
      deserialized.type,
      deserialized.settings
    );
    diagrams.set(id, diagram);
    return diagram;
  } catch (error) {
    console.log(error);
    return null;
  }
}

/// `removeDiagram` deletes a diagram/visualization from the memory AND from
/// the local storage
export function removeDiagram(diagram: Diagram): void {
  diagrams.delete(diagram.id);
  const storageKey = "dia-" + diagram.id;
  localforage.removeItem(storageKey);
}

/// `changeSetting` updates a diagram's setting and will call the `onChange`
/// handler so visualizations can be redrawn.
export function changeSetting(diagram: Diagram, key: string, value: any): void {
  diagram.settings[key] = value;
  if (diagram.onChange) {
    diagram.onChange(diagram, key);
  }
  const storageKey = "dia-" + diagram.id;

  // local storage needs to be updated (which is still pretty cheap,
  // considering that the diagram's dataset is stored separately and is
  // never updated)
  localforage.setItem(storageKey, diagramToJSON(diagram));
}
