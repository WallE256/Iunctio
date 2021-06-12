<template>
  <div id="canvas-parent" ref="canvas-parent" style="height: 100%; width: 100%;">
    <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  </div>
  <p id="graph-tooltip" ref="graph-tooltip" style="position: fixed; user-select: none;"></p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Graph from "graphology";
import { debounce } from "lodash";
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import * as GlobalStorage from "@/scripts/globalstorage";

// stolen from https://pixijs.download/dev/docs/packages_graphics-extras_src_drawTorus.ts.html
function drawTorus(graphics: PIXI.Graphics,
    x: number,
    y: number,
    innerRadius: number,
    outerRadius: number,
    startArc = 0,
    endArc: number = Math.PI * 2,
): PIXI.Graphics {
  if (Math.abs(endArc - startArc) >= Math.PI * 2)
  {
    return graphics
      .drawCircle(x, y, outerRadius)
      .beginHole()
      .drawCircle(x, y, innerRadius)
      .endHole();
  }
  graphics.finishPoly();
  graphics
    .arc(x, y, innerRadius, endArc, startArc, true)
    .arc(x, y, outerRadius, startArc, endArc, false)
    .finishPoly();
  return graphics;
}

// see also scripts/settingconfig.ts
type Settings = {
  root: string | null,
  height: number,
  variety: string,
  edgeType: string,
  colourType: string,
  diagramColour: number,
  minRenderSize: number,
};

export default defineComponent({
  props: {
    diagramid: {
      type: String,
      required: true,
    },
  },

  async mounted() {
    this.canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
    const canvasParent = this.$refs["canvas-parent"] as HTMLElement;

    this.diagram = await GlobalStorage.getDiagram(this.diagramid);
    if (!this.diagram) {
      console.warn("Non-existent diagram:", this.diagramid);
      return;
    }
    this.graph = await GlobalStorage.getDataset(this.diagram.graphID);
    if (!this.graph) {
      console.warn("Non-existent dataset:", this.diagram.graphID);
      return;
    }

    this.tooltip = this.$refs["graph-tooltip"] as HTMLElement;

    this.app = new PIXI.Application({
      view: this.canvas,
      antialias: true,
      backgroundAlpha: 0,
      resizeTo: canvasParent,
    });

    // Create map for number of connections between nodes
    this.bothConnections = new Map();
    this.outConnections = new Map();

    [this.bothConnections, this.outConnections] = this.mapConnections(this.graph);

    const app = this.app as PIXI.Application;

    // this has to happen next tick because otherwise the element sizes are not
    // correct yet (because they've not been rendered yet)
    this.$nextTick(() => {
      app.resize();
      this.diagram.onChange = (diagram: GlobalStorage.Diagram, changedKey: string) => {

        if (changedKey === "name") {
          return;
        }

        if (changedKey === "selectedNode") {
          // un-highlight old nodes
          const clearTint = 0xffffff;
          for (const node of this.selectedNodes) {
            const graphicsList = this.graphicsMap.get(node) || [];
            for (const graphics of graphicsList) {
              graphics.tint = clearTint;
            }
          }

          this.selectedNodes = GlobalStorage.selectedNodes
            .filter((node) => node.datasetID === diagram.graphID)
            .map((node) => node.nodeID);

          // highlight new nodes
          const highlightTint = 0x00D737;
          for (const node of this.selectedNodes) {
            const graphicsList = this.graphicsMap.get(node) || [];
            for (const graphics of graphicsList) {
              graphics.tint = highlightTint;
            }
          }

          return;
        }

        this.draw(app, this.diagram.settings);
      };
    });

    this.draw(app, this.diagram.settings);
  },

  created(){
    window.addEventListener(
      "resize",
      debounce((event) => {
        if (!this.diagram) {
          return;
        }
        this.handleResize(event, this.graph, this.app as PIXI.Application, this.diagram.settings as Settings);
      }, 250)
    )
  },

  data() {
    return {
      // the node that you're currently hovering over
      hoverNode: null as string | null,
      graph: null as any,
      diagram: null as any,
      app: null as null | PIXI.Application,
      tooltip: document.createElement('null'),
      canvas: null as null | HTMLCanvasElement,
      clickedNode: false,
      double: 0,
      centerX: 0,
      centerY: 0,
      levelHeight: 0,
      maxWidth: 0,
      maxHeight: 0,
      bothConnections: new Map(),
      outConnections: new Map(),
      attributesColourMap: new Map(),
      colours: null as any,
      selectedNodes: [] as string[],
      graphicsMap: new Map<string, PIXI.Graphics[]>(),
    };
  },

  methods: {
    handleResize(e: any, graph: Graph, app: PIXI.Application, settings: Settings) {
      this.draw(app, settings);
    },

    // Create map of connections between nodes
    mapConnections(graph: Graph) {
      const map_both = new Map();
      const map_out = new Map();

      // Count edges between two nodes
      graph.forEachNode((node_1) => {
        graph.forEachNode((node_2) => {
          map_both.set(node_1 + "_" + node_2, graph.edges(node_1, node_2).length);
          map_out.set(node_1 + ">" + node_2, graph.outEdges(node_1, node_2).length);
        });
      });

      return [map_both, map_out];
    },

    // Draw the diagram
    draw(
      app: PIXI.Application,
      settings: Settings,
    ) {
      app.stage.removeChildren();
      for (const [node, graphicsList] of this.graphicsMap) {
        for (const graphics of graphicsList) graphics.clear();
        graphicsList.length = 0;
      }

      const canvas = this.canvas as HTMLCanvasElement;

      this.centerX = canvas.width / 2;
      this.centerY = canvas.height / 2;

      const predecessors = [] as any[];

      // Calculate height based on graph type
      if (settings.variety === "sunburst") {
        this.maxWidth = Math.min(canvas.width, canvas.height) * .7;
        this.maxHeight = this.maxWidth;
        this.levelHeight = this.maxHeight / (1.75 * settings.height);

        this.drawDiagram(this.graph, app, settings, settings.root, predecessors, 0, 0, 1, settings.diagramColour);
      } else {
        var borderSize = Math.min(canvas.width, canvas.height) * .2;
        this.maxWidth = canvas.width - borderSize;
        this.maxHeight = canvas.height - borderSize;
        this.levelHeight = this.maxHeight / settings.height;

        this.drawDiagram(this.graph, app, settings, settings.root, predecessors, 0, 0, 1, settings.diagramColour);
      }
    },

  // Draw the subtree of given diagram
  drawDiagram(
    graph: Graph,
    app: PIXI.Application,
    settings: Settings,
    node: any,
    newPredecessors: any,
    level: number,
    drawStart: number,
    sizePerc: number,
    subtreeColour: any,
  ) {

    // Only draw if the node is rendered wide enough
    if (sizePerc >= 1 / settings.minRenderSize) {

      // If no node is given (so no root was selected)
      if (!node) {
        var totalDegree = 0;
        var nodesWithDegree = 0;

        // Calculate total degree for all nodes
        graph.forEachNode((node, attributes) => {
          if (settings.edgeType == 'incoming') {
            if (graph.inDegree(node) > 0) {
              nodesWithDegree += 1;
              totalDegree += graph.inDegree(node);
            }
          } else if (settings.edgeType == 'outgoing') {
            if (graph.outDegree(node) > 0) {
              nodesWithDegree += 1;
              totalDegree += graph.outDegree(node);
            }
          } else {
            if (graph.degree(node) > 0) {
              nodesWithDegree += 1;
              totalDegree += graph.degree(node);
            }
          }
        });

        // Create colour pattern
        if (settings.colourType === "rainbow") {
          this.colours = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, nodesWithDegree + 1));
        } else {

          let indexNumber = 0;
          this.attributesColourMap = new Map();

          graph.forEachNode((node, attributes) => {
            if (attributes[settings.colourType]) {
              this.attributesColourMap.set(attributes[settings.colourType], indexNumber);
              indexNumber += 1;
            }
          });

          this.colours = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, this.attributesColourMap.size + 1));
        }

        let index = 0;

        // Draw subtrees
        graph.forEachNode((node, attributes) => {

          var newSizePerc = 0;

          if (settings.edgeType == "incoming") {
            newSizePerc = graph.inDegree(node);
          } else if (settings.edgeType == "outgoing") {
            newSizePerc = graph.outDegree(node);
          } else {
            newSizePerc = graph.degree(node);
          }

          if (newSizePerc > 0) {

            newSizePerc /= totalDegree;

            var c;
            var convertedColour;

            if ((settings.colourType === "rainbow")) {
              c = d3.color(this.colours(index.toString()));
              convertedColour = c?.formatHex().replace("#", "0x") || "0xffffff";
            } else {
              c = d3.color(this.colours(this.attributesColourMap.get(attributes[settings.colourType]).toString()));
              convertedColour = c?.formatHex().replace("#", "0x") || "0xffffff";
            }

            predecessors = [];

            // Start at level 1 for sunburst diagram if no node is given
            if (settings.variety === "sunburst") {
              level = 1;
            }

            this.drawDiagram(graph, app, settings, node, predecessors, level, drawStart, newSizePerc, convertedColour);
            drawStart += newSizePerc;
            index += 1;
          }
        });
      } else {

        // Draw node
        this.drawNode(app, settings, node, level, drawStart, sizePerc, subtreeColour);

        // Add this node to copy of predecessors
        var predecessors = [...newPredecessors];
        predecessors.push(node);

        // Next layer
        if (level < settings.height - 1) {

          var downstreamConnections = 0;

          // Count downstream connections
          graph.forEachNeighbor(node, (neighbour, attributes) => {

            if (!this.isPredecessor(predecessors, neighbour)) {

              if (settings.edgeType == "incoming") {
                downstreamConnections += this.outConnections.get(neighbour + ">" + node);
              } else if (settings.edgeType == "outgoing") {
                downstreamConnections += this.outConnections.get(node + ">" + neighbour);
              } else {
                downstreamConnections += this.bothConnections.get(node + "_" + neighbour);
              }

            }
          });

          // Calculate child size and draw
          graph.forEachNeighbor(node, (neighbour, attributes) => {

            if (!this.isPredecessor(predecessors, neighbour)) {

              if ((settings.colourType !== "rainbow")) {

                const c = d3.color(this.colours(this.attributesColourMap.get(attributes[settings.colourType]).toString()));
                subtreeColour = c?.formatHex().replace("#", "0x") || "0xffffff";
              }

              var newSizePerc = 0;

              if ((settings.edgeType === "incoming") && (this.outConnections.get(neighbour + ">" + node) > 0)) {
                newSizePerc = sizePerc * this.outConnections.get(neighbour + ">" + node) / downstreamConnections;

                this.drawDiagram(graph, app, settings, neighbour, predecessors, level + 1, drawStart, newSizePerc, subtreeColour);
                drawStart += newSizePerc;

              } else if ((settings.edgeType === "outgoing") && (this.outConnections.get(node + ">" + neighbour) > 0)) {
                newSizePerc = sizePerc * this.outConnections.get(node + ">" + neighbour) / downstreamConnections;

                this.drawDiagram(graph, app, settings, neighbour, predecessors, level + 1, drawStart, newSizePerc, subtreeColour);
                drawStart += newSizePerc;

              } else if ((settings.edgeType !== "incoming") && (settings.edgeType !== "outgoing") && (this.bothConnections.get(node + "_" + neighbour) > 0)) {
                newSizePerc = sizePerc * this.bothConnections.get(node + "_" + neighbour) / downstreamConnections;

                this.drawDiagram(graph, app, settings, neighbour, predecessors, level + 1, drawStart, newSizePerc, subtreeColour);
                drawStart += newSizePerc;
              }
            }
          });
        }
      }
    }
  },

  // Check if node is in the list of predecessors
  isPredecessor(predecessors: any, neighbour: any) {
    var predecessor = false;

    for (let index = 0; index < predecessors.length; index++) {
      if (predecessors[index] == neighbour) {
        predecessor = true;
      }
    }
    return predecessor;
  },

  // Draw node
  drawNode(app: PIXI.Application, settings: Settings, node: any, level: any, drawStart: any, sizePerc: any, nodeColour: any) {

    // Create graphics
    const drawnNode = new PIXI.Graphics();
    const graphicsList = this.graphicsMap.get(node);
    if (graphicsList) {
      graphicsList.push(drawnNode);
    } else {
      this.graphicsMap.set(node, [drawnNode]);
    }

    drawnNode.beginFill(nodeColour);
    drawnNode.lineStyle(1, 0xFFFFFF);

    const canvas = this.canvas as HTMLCanvasElement;

    if (settings.variety === "sunburst") {

      var startAngle = 2 * Math.PI * drawStart;
      var endAngle = 2 * Math.PI * (drawStart + sizePerc);
      var minRadius = level * this.levelHeight;
      var maxRadius = minRadius + this.levelHeight;

      if (level == 0) {
        drawnNode.drawCircle(0, 0, maxRadius);
      } else {
        drawTorus(drawnNode, 0, 0, minRadius, maxRadius, startAngle, endAngle);
      }

      drawnNode.x = this.centerX;
      drawnNode.y = this.centerY;

    } else if (settings.variety === "flame") {

      drawnNode.drawRect(0, 0, this.maxWidth * sizePerc, this.levelHeight);

      drawnNode.x = this.centerX - (this.maxWidth / 2) + (this.maxWidth * drawStart);
      drawnNode.y = this.centerY + (this.maxHeight / 2) - (this.levelHeight * (level + 1));

    } else {

      drawnNode.drawRect(0, 0, this.maxWidth * sizePerc, this.levelHeight);

      drawnNode.x = this.centerX - (this.maxWidth / 2) + (this.maxWidth * drawStart);
      drawnNode.y = this.centerY - (this.maxHeight / 2) + (this.levelHeight * level);

    }

    drawnNode.endFill();
    app.stage.addChild(drawnNode);

    // Interactivity
    drawnNode.interactive = true;
    drawnNode.buttonMode = true;

    // Set root on click
    drawnNode.on('click', (event) => {
      event.stopPropagation();

      // If another click has been detected in the past 600 ms.
      if ((this.clickedNode) && (this.clickedNode == node)) {

        // Reset graph is the user presses the node in the middle
        if ((level == 0) && (sizePerc == 1)) {
          GlobalStorage.changeSetting(this.diagram, "root", null, "diagramColour", nodeColour)
        } else {
          GlobalStorage.changeSetting(this.diagram, "root", node, "diagramColour", nodeColour)
        }

        this.clickedNode = false;
        clearTimeout(this.double);

      } else {
        clearTimeout(this.double);
        this.clickedNode = node;
        this.double = setTimeout(() => {
          this.clickedNode = false;

          // single click means selecting --> brush-and-link interactivity
          const append = (event.data.originalEvent as MouseEvent).ctrlKey;
          this.$emit("selected-node-change", this.diagram.graphID, node, append);
        }, 600); // Set timeout at 600 ms for double click detection

      }
    });

    // Show node name on hover
    drawnNode.on('pointerover', (event) => {
      event.stopPropagation();

      this.tooltip.style.display = "inline";
      this.tooltip.innerText = "Node: " + node;
      if (settings.variety === "sunburst") {
        this.tooltip.style.left = drawnNode.x + "px";
        this.tooltip.style.top = drawnNode.y + canvas.height * 0.05 + "px";
      } else {
        this.tooltip.style.left = drawnNode.x + (this.maxWidth * sizePerc / 2) + "px";
        this.tooltip.style.top = drawnNode.y + canvas.height * 0.15 + "px";
      }
    });

    // Hide node name after hover
    drawnNode.on('pointerout', (event) => {
      event.stopPropagation();

      this.tooltip.style.display = "none";
    });
  }
},
});
</script>
