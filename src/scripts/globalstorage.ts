// use as follows:
// import * as GlobalStorage from "@/scripts/globalstorage";
// the Visualise.vue page should use these functions to manage the
// uploaded datasets and the created visualizations/diagrams.

import Graph from "graphology";
import localforage from "localforage";
import { sortEdgesByDate, sortNodesByCommunity } from "@/scripts/sorter";

/// An object that stores a diagram's properties, e.g. its identifier, name
/// and settings. The diagrams are usually stored in a global map and can be
/// serialized to be stored in localstorage.
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

  /// This diagram's name.
  name: string;

  /// The change listener, which is called when a setting is changed using
  /// `changeSetting()`.
  /// NOTE: do not access this yourself, use `update()` and `addOnChange`
  /// instead.
  onChange: ((diagram: Diagram, changedKey: string) => void)[];

  /// Whether this diagram should be displayed in the diagram list.
  invisible: boolean;

  ///
  constructor(
    id: string,
    graphID: string,
    type: string,
    settings?: any,
    name?: string,
  ) {
    this.id = id;
    this.graphID = graphID;
    this.type = type;
    if (settings) {
      this.settings = settings;
    } else {
      this.settings = {};
    }
    this.onChange = [];
    if (name) {
      this.name = name;
    } else {
      this.name = type + "-" + id;
    }
    this.invisible = false;
  }

  /// Adds an on-change listener to this diagram. Each on-change listener that
  /// was added, will be called whenever a setting or other property on the
  /// diagram is changed.
  addOnChange(listener: (diagram: Diagram, changedKey: string) => void): void {
    this.onChange.push(listener);
  }

  update(changedKey: string): void {
    for (const listener of this.onChange) {
      listener(this, changedKey);
    }
  }
}

/// `Dataset` represents a dataset that the user has uploaded to the website.
///
/// Each dataset will be added to a global map as well as to the localstorage.
///
/// In addition to storing the graph object, it also stores how nodes are
/// clustered and it stores the edges sorted by date, so this information does
/// not have to be recalculated for every diagram.
export class Dataset {
  /// The graphology `Graph` object that stores all the nodes and edges of a
  /// datset, and all additional data attached to them (attributes).
  readonly graph: Graph;

  ///
  name: string;

  ///
  readonly clusteredNodes: string[];

  ///
  readonly sortedEdges: Map<string, string[]>;

  constructor(graph: Graph, name: string) {
    this.graph = graph;
    this.name = name;
    this.clusteredNodes = sortNodesByCommunity(graph);
    this.sortedEdges = sortEdgesByDate(graph);
    this.name = name;
  }

  ///
  getClusteredNodes(): string[] {
    return this.clusteredNodes;
  }

  ///
  getSortedEdges(): Map<string, string[]> {
    return this.sortedEdges;
  }
}

export function createID(): string {
  // this is unique enough and not too long
  return String(Math.floor(Date.now() % 1e5));
}

const diagrams = new Map<string, Diagram>();
const datasets = new Map<string, Dataset>();

// has to be a { value } object, because otherwise it cannot be reassigned
const datasetList = { values: null as string[] | null };
const diagramList = { values: null as string[] | null };

function diagramToJSON(diagram: Diagram): any {
  // unfortunately this function is necessary, or it will try to serialize the
  // onChange field as well
  return {
    id: diagram.id,
    name: diagram.name,
    graphID: diagram.graphID,
    type: diagram.type,
    settings: Object.assign({}, diagram.settings),
    invisible: diagram.invisible,
  };
}

async function mutateStorageList(
  storageID: string,
  listObject: { values: string[] | null },
  callback: (list: string[]) => void
): Promise<void> {
  if (listObject.values) {
    // if it's in memory, there's no need to fetch if from local storage first
    callback(listObject.values);
  } else {
    // otherwise, get it from local storage & pass it to the callback there
    const local = await localforage.getItem(storageID);
    const result = (local ? local : []) as string[];
    listObject.values = result;
    callback(listObject.values);
  }
  // update to local storage so the change is still there for the next time
  await localforage.setItem(storageID, listObject.values);
}

/// `getDatasets` gives the list of IDs of all uploaded datasets (looking for
/// them, both in memory and in the localstorage).
export async function getDatasets(): Promise<string[]> {
  if (!datasetList.values) {
    datasetList.values = (await localforage.getItem("datasets") || []) as string[];
  }
  return datasetList.values;
}

/// `addDataset` adds a dataset to the global storage.
export async function addDataset(id: string, dataset: Dataset): Promise<void> {
  datasets.set(id, dataset);
  const storageKey = "dataset-" + id;

  // ...these could probably be updated in parallel, using Promise.all but that
  // doesn't seem to work
  await localforage.setItem(storageKey, {
    name: dataset.name,
    graph: dataset.graph.export(),
  });

  await mutateStorageList("datasets", datasetList, (ids) => {
    ids.push(id);
  });
}

/// `getDataset` returns the graph that corresponds to the given id, or
/// `null` if it does not exist.
/// It will be fetched from memory, or localStorage if that is not available.
export async function getDataset(id: string): Promise<Dataset | null> {
  // if it's in the memory, use that (so parsing JSON is not necessary)
  const inMemory = datasets.get(id);
  if (inMemory) {
    return inMemory;
  }

  // otherwise, look for the dataset in localStorage
  try {
    const storageKey = "dataset-" + id;
    const storageItem = (await localforage.getItem(storageKey)) as any;
    const dataset = new Dataset(Graph.from(storageItem.graph), storageItem.name);
    datasets.set(id, dataset);
    return dataset;
  } catch (error) {
    console.log(error);
    return null;
  }
}

/// `removeDataset` deletes a dataset from the memory AND from the local storage.
export function removeDataset(id: string): void {
  datasets.delete(id);
  const storageKey = "dataset-" + id;
  localforage.removeItem(storageKey);

  mutateStorageList("datasets", datasetList, (ids) => {
    const index = ids.indexOf(id);
    if (index !== -1) ids.splice(index, 1);
  });
}

/// `getDiagrams` returns a list of all diagram IDs and will look for these
/// both in memory and in local storage.
export async function getDiagrams(): Promise<string[]> {
  if (!diagramList.values) {
    diagramList.values = (await localforage.getItem("diagrams") || []) as string[];
  }
  return diagramList.values;
}

/// `addDiagram` will add a new diagram to local storage.
export async function addDiagram(diagram: Diagram): Promise<void> {
  diagrams.set(diagram.id, diagram);
  const storageKey = "dia-" + diagram.id;
  await localforage.setItem(storageKey, diagramToJSON(diagram));

  await mutateStorageList("diagrams", diagramList, (ids) => {
    ids.push(diagram.id);
  });
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
    const storageItem = await localforage.getItem(storageKey) as any;
    const diagram = new Diagram(
      storageItem.id,
      storageItem.graphID,
      storageItem.type,
      storageItem.settings,
      storageItem.name,
    );
    diagram.invisible = storageItem.invisible;
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

  mutateStorageList("diagrams", diagramList, (ids) => {
    const index = ids.indexOf(diagram.id);
    if (index !== -1) ids.splice(index, 1);
  });
}

/// `removeDiagramByID` deletes a diagram/visualization from the memory AND from
/// the local storage
export function removeDiagramByID(diagramID: string): void {
  getDiagram(diagramID).then((diagram) => {
    const remove_diag = diagram as Diagram;
    removeDiagram(remove_diag);
  });
}

/// `changeSetting` updates a diagram's setting(s) and will `update` the
/// diagram, so the visualizations can be redrawn.
/// updates multiple settings if multiple are provided
export function changeSetting(diagram: Diagram, ...values: any[]): void {
  for (let index = 0; index < values.length; index += 2) {
    diagram.settings[values[index]] = values[index + 1];
  }
  diagram.update(values[0]);
  const storageKey = "dia-" + diagram.id;

  // local storage needs to be updated (which is still pretty cheap,
  // considering that the diagram's dataset is stored separately and is
  // never updated)
  getDiagram(diagram.id).then((diag) => {
    if (diag) localforage.setItem(storageKey, diagramToJSON(diag));
  });
}

/// `changeName` updates a diagram's name and will update the diagram,
/// so the visualizations can be redrawn.
export function changeName(diagram: Diagram, name: string): void {
  diagram.name = name;
  const storageKey = "dia-" + diagram.id;

  // local storage needs to be updated (which is still pretty cheap,
  // considering that the diagram's dataset is stored separately and is
  // never updated)
  localforage.setItem(storageKey, diagramToJSON(diagram));
}

/// The currently selected nodes (the user can select multiple with
/// Ctrl+Click).
export const selectedNodes = [] as {
  // The ID of the dataset, so `GlobalStorage.getDataset(datasetID)` will give
  // you the graph that the node belongs to.
  datasetID: string;
  // The ID of the node in the Graph object
  nodeID: any;
}[];
