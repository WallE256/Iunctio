import * as GlobalStorage from "@/scripts/globalstorage";
import Graph from "graphology";

///
export type Setting = {
  id: string;
  component: string;
  name: string;
  properties?: any;
};

/// Adds a diagram to globalstorage along with that diagram's default settings.
/// Returns the settings.
export function getDefaultSettings(componentName: string): any {
  switch (componentName) {
    case "ArcDiagram": {
      return {
        variety: "circle",
        hoverEdgeDirection: "outgoing",
      };
    }

    case "SunburstDiagram": {
      return {
        variety: "sunburst",
        root: null,
        edgeType: "outgoing",
        height: 4,
        widthType: "connections",
        colourType: "rainbow",
        diagramColour: 0x4287f5,
        minRenderSize: 10000,
      };
    }

    case "DistributionDiagram": {
      return {
        variety: "distribution",
        logarithmic: false,
      };
    }

    default: {
      console.warn("Non-existent diagram type:", componentName);
      return {};
    }
  }
}

///
export function getVisibleSettings(
  diagram: GlobalStorage.Diagram,
  graph: Graph
): Setting[] {
  switch (diagram.type) {
    case "ArcDiagram": {
      return [
        {
          id: "variety",
          component: "SelectSetting",
          name: "Node-Link Diagram Variety",
          properties: {
            options: ["circle", "line"],
            value: diagram.settings.variety,
          },
        },
        {
          id: "hoverEdgeDirection",
          component: "SelectSetting",
          name: "Edge Direction",
          properties: {
            options: ["incoming", "outgoing", "both"],
            value: diagram.settings.hoverEdgeDirection,
          },
        },
      ];
    }

    case "SunburstDiagram": {
      return [
        {
          id: "variety",
          component: "SelectSetting",
          name: "Hierarchical Diagram Variety",
          properties: {
            options: ["sunburst", "flame", "inverse-flame"],
            value: diagram.settings.variety,
          },
        },
        {
          id: "root",
          component: "SelectSetting",
          name: "Root Node",
          properties: {
            options: ["[no root]"].concat(graph.nodes()), // TODO this has to show a proper name instead of IDs
            value: diagram.settings.root,
          },
        },
        {
          id: "edgeType",
          component: "SelectSetting",
          name: "Edge Direction",
          properties: {
            options: ["incoming", "outgoing", "both"],
            value: diagram.settings.edgeType,
          },
        },
        {
          id: "height",
          component: "NumberSetting",
          name: "Layer Count",
          properties: {
            min: 0,
            max: 10,
            value: diagram.settings.height,
          },
        },
        {
          id: "widthType",
          component: "SelectSetting",
          name: "Width Determined By",
          properties: {
            options: ["connections", "subtree-size"],
            value: diagram.settings.widthType,
          },
        },
        {
          id: "colourType",
          component: "SelectSetting",
          name: "Colour Determined By",
          properties: {
            options: ["rainbow"].concat(
              Object.keys(graph.getNodeAttributes(graph.nodes()[0]))
            ),
            value: diagram.settings.colourType,
          },
        },
        {
          id: "minRenderSize",
          component: "NumberSetting",
          name: "Minimum Node Size",
          properties: {
            min: 0,
            value: diagram.settings.minRenderSize,
          },
        },
      ];
    }

    case "DistributionDiagram": {
      return [
        {
          id: "variety",
          component: "SelectSetting",
          name: "Diagram Variety",
          properties: {
            options: ["distribution", "histogram"],
            value: diagram.settings.variety,
          },
        },
        {
          id: "logarithmic",
          component: "CheckboxSetting",
          name: "Logarithmic",
          properties: {
            value: diagram.settings.logarithmic,
          },
        },
      ];
    }

    default: {
      console.warn("Non-existent diagram type:", diagram.type);
      return [];
    }
  }
}
