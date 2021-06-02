<template>
  <div id="canvas-parent" ref="canvas-parent" style="margin: 0; padding: 0; height: 100%; width: 100%;">
    <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  </div>
  <p id="graph-tooltip" ref="graph-tooltip" style="position: fixed; user-select: none;"></p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Graph from "graphology";
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import * as GlobalStorage from "@/scripts/globalstorage";

var graph = null as any;
var diagram = null as any;
var app;
let tooltip = document.createElement('null');

// Create map for number of connections between nodes
var bothConnections = new Map();
var outConnections = new Map();

var clickedNode = false;
var double = 0;

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

type Settings = {
  root: string | null,
  height: number,
  variety: string,
  edgeType: string,
  widthType: string,
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
    diagram = await GlobalStorage.getDiagram(this.diagramid);
    if (!diagram) {
      console.warn("Non-existent diagram:", this.diagramid);
      return;
    }
    graph = await GlobalStorage.getDataset(diagram.graphID);
    if (!graph) {
      console.warn("Non-existent dataset:", diagram.graphID);
      return;
    }

    const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
    const canvasParent = this.$refs["canvas-parent"] as HTMLElement;
    tooltip = this.$refs["graph-tooltip"] as HTMLElement;

    const app = new PIXI.Application({
      view: canvas,
      antialias: true,
      backgroundAlpha: 0,
      resizeTo: canvasParent,
    });

    const settings = diagram.settings as Settings;

    if (settings.widthType == "connections") {
      [bothConnections, outConnections] = this.mapConnections(graph);
    }

    // this has to happen next tick because otherwise the element sizes are not
    // correct yet (because they've not been rendered yet)
    this.$nextTick(() => {
      app.resize();
      diagram.onChange = (diagram: any, changedKey: any) => {
        app.stage.removeChildren();

        const settings = diagram.settings;
        const root = settings.root === "[no root]" ? null : settings.root;
        this.draw(graph, app, root, settings, bothConnections, outConnections, 0x4287f5);
      };

      this.draw(graph, app, settings.root, settings, bothConnections, outConnections, 0x4287f5);
    });
  },

  data() {
    return {
      // the node that you're currently hovering over
      hoverNode: null as string | null,
    };
  },

  methods: {

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
      graph: Graph,
      app: PIXI.Application,
      root: any,
      settings: Settings,
      bothConnections: any,
      outConnections: any,
      nodeColour: any,
    ) {
      const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

      app.stage.removeChildren();

      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const predecessors = [] as any[];

      var maxWidth;
      var maxHeight;
      var levelHeight;

      // Calculate height based on graph type
      if (settings.variety === "sunburst") {
        maxWidth = Math.min(canvas.width, canvas.height) * .7;
        maxHeight = maxWidth;
        levelHeight = maxHeight / (2 * settings.height);

        this.drawDiagram(graph, app, settings, root, bothConnections, outConnections, predecessors, 0, maxWidth, levelHeight, 0, 1, centerX, centerY, nodeColour);
      } else {
        var borderSize = Math.min(canvas.width, canvas.height) * .2;
        maxWidth = canvas.width - borderSize;
        maxHeight = canvas.height - borderSize;
        levelHeight = maxHeight / (settings.height + 1);

        this.drawDiagram(graph, app, settings, root, bothConnections, outConnections, predecessors, 0, maxWidth, levelHeight, 0, 1, centerX, centerY, nodeColour);
      }
    },

  // Draw the subtree of given diagram
  drawDiagram(
    graph: Graph,
    app: PIXI.Application,
    settings: Settings,
    node: any,
    bothConnections: any,
    outConnections: any,
    newPredecessors: any,
    level: number,
    maxWidth: number,
    levelHeight: number,
    drawStart: number,
    sizePerc: number,
    centerX: number,
    centerY: number,
    subtreeColour: any,
  ) {

    // Only draw if the node is rendered wide enough
    if (sizePerc >= settings.minRenderSize) {

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
        const colours = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, nodesWithDegree + 1));

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

            const c = d3.color(colours(index.toString()));
            const convertedColour = c?.formatHex().replace("#", "0x") || "0xffffff";

            predecessors = [];

            // Start at level 1 for sunburst diagram if no node is given
            if (settings.variety === "sunburst") {
              level = 1;
            }

            this.drawDiagram(graph, app, settings, node, bothConnections, outConnections, predecessors, level, maxWidth, levelHeight, drawStart, newSizePerc, centerX, centerY, convertedColour);
            drawStart += newSizePerc;
            index += 1;
          }
        });
      } else {

        // Draw node
        if (settings.variety === "sunburst") {
          this.drawNodeSunburst(app, settings, node, centerX, centerY, level, levelHeight, drawStart, sizePerc, subtreeColour);
        } else {
          this.drawNodeFlame(app, settings, node, centerX, centerY, maxWidth, drawStart, sizePerc, level, levelHeight, subtreeColour);
        }

        // Add this node to copy of predecessors
        var predecessors = [...newPredecessors];
        predecessors.push(node);

        // Next layer
        if (level < settings.height) {

          var downstreamConnections = 0;

          // Count downstream connections
          graph.forEachNeighbor(node, (neighbour, attributes) => {

            if (!this.isPredecessor(predecessors, neighbour)) {

              if (settings.edgeType == "incoming") {
                downstreamConnections += outConnections.get(neighbour + ">" + node);
              } else if (settings.edgeType == "outgoing") {
                downstreamConnections += outConnections.get(node + ">" + neighbour);
              } else {
                downstreamConnections += bothConnections.get(node + "_" + neighbour);
              }

            }
          });

          // Calculate child size and draw
          graph.forEachNeighbor(node, (neighbour, attributes) => {

            if (!this.isPredecessor(predecessors, neighbour)) {

              var newSizePerc = 0;

              if ((settings.edgeType === "incoming") && (outConnections.get(neighbour + ">" + node) > 0)) {
                newSizePerc = sizePerc * outConnections.get(neighbour + ">" + node) / downstreamConnections;

                this.drawDiagram(graph, app, settings, neighbour, bothConnections, outConnections, predecessors, level + 1, maxWidth, levelHeight, drawStart, newSizePerc, centerX, centerY, subtreeColour);
                drawStart += newSizePerc;

              } else if ((settings.edgeType === "outgoing") && (outConnections.get(node + ">" + neighbour) > 0)) {
                newSizePerc = sizePerc * outConnections.get(node + ">" + neighbour) / downstreamConnections;

                this.drawDiagram(graph, app, settings, neighbour, bothConnections, outConnections, predecessors, level + 1, maxWidth, levelHeight, drawStart, newSizePerc, centerX, centerY, subtreeColour);
                drawStart += newSizePerc;

              } else if ((settings.edgeType !== "incoming") && (settings.edgeType !== "outgoing") && (bothConnections.get(node + "_" + neighbour) > 0)) {
                newSizePerc = sizePerc * bothConnections.get(node + "_" + neighbour) / downstreamConnections;

                this.drawDiagram(graph, app, settings, neighbour, bothConnections, outConnections, predecessors, level + 1, maxWidth, levelHeight, drawStart, newSizePerc, centerX, centerY, subtreeColour);
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

  // Draw node for sunburst graph
  drawNodeSunburst(app: PIXI.Application, settings: Settings, node: any, centerX: any, centerY: any, level: any, levelHeight: any, drawStart: any, sizePerc: any, nodeColour: any) {

    var startAngle = 2 * Math.PI * drawStart;
    var endAngle = 2 * Math.PI * (drawStart + sizePerc);
    var minRadius = level * levelHeight;
    var maxRadius = minRadius + levelHeight;

    const sunburstNode = new PIXI.Graphics();

    sunburstNode.beginFill(nodeColour);
    sunburstNode.lineStyle(1, 0xFFFFFF);
    if (level == 0) {
      sunburstNode.drawCircle(0, 0, maxRadius);
    } else {
      drawTorus(sunburstNode, 0, 0, minRadius, maxRadius, startAngle, endAngle);
    }
    sunburstNode.x = centerX;
    sunburstNode.y = centerY;
    sunburstNode.endFill();
    app.stage.addChild(sunburstNode);

    // Interactivity
    sunburstNode.interactive = true;
    sunburstNode.buttonMode = true;

    // Set root on click
    sunburstNode.on('click', (event) => {
      event.stopPropagation();

      // If another click has been detected in the past 600 ms.
      if ((clickedNode) && (clickedNode == node)) {

        // Reset graph is the user presses the node in the middle
        if (level == 0) {
          this.draw(graph, app, false, settings, bothConnections, outConnections, nodeColour);
        } else {
          this.draw(graph, app, node, settings, bothConnections, outConnections, nodeColour);
        }

        clickedNode = false;
        clearTimeout(double);

      } else {
        clearTimeout(double);
        clickedNode = node;
        double = setTimeout(() => { clickedNode = false; }, 600); // Set timeout at 600 ms for double click detection
      }
    });

    // Show node name on hover
    sunburstNode.on('mouseover', (event) => {
      event.stopPropagation();

      tooltip.style.display = "inline";
      tooltip.innerText = "Node: " + node;
      tooltip.style.left = sunburstNode.x + "px";
      tooltip.style.top = sunburstNode.y + "px";
    });

    // Hide node name after hover
    sunburstNode.on('mouseout', (event) => {
      event.stopPropagation();

      tooltip.style.display = "none";
    });
  },

  // Draw node for flame graph
  drawNodeFlame(app: PIXI.Application, settings: Settings, node: any, centerX: any, centerY: any, maxWidth: any, drawStart: any, sizePerc: any, level: any, levelHeight: any, nodeColour: any) {
    var posX = centerX - (maxWidth / 2) + (maxWidth * drawStart);
    var posY = 0;
    if (settings.variety == "flame") {
      posY = centerY + ((levelHeight * (settings.height + 1)) / 2) - (levelHeight * (level + 1));
    } else {
      posY = centerY - ((levelHeight * (settings.height + 1)) / 2) + (levelHeight * (level + 1));
    }
    var levelWidth = maxWidth * sizePerc;

    const flameNode = new PIXI.Graphics();

    flameNode.beginFill(nodeColour);
    flameNode.lineStyle(1, 0xFFFFFF);
    flameNode.drawRect(0, 0, levelWidth, levelHeight);
    flameNode.endFill();
    flameNode.x = posX;
    if (settings.variety === "flame") {
      flameNode.y = posY;
    } else {
      flameNode.y = posY - levelHeight;
    }
    app.stage.addChild(flameNode);

    // Interactivity
    flameNode.interactive = true;
    flameNode.buttonMode = true;

    // Set root on click
    flameNode.on('click', (event) => {
      event.stopPropagation();

      // If another click has been detected in the past 600 ms.
      if ((clickedNode) && (clickedNode == node)) {

        // Reset graph is the user presses the node in the middle
        if ((level == 0) && (sizePerc == 1)) {
          this.draw(graph, app, false, settings, bothConnections, outConnections, nodeColour);
        } else {
          this.draw(graph, app, node, settings, bothConnections, outConnections, nodeColour);
        }

        clickedNode = false;
        clearTimeout(double);

      } else {
        clearTimeout(double);
        clickedNode = node;
        double = setTimeout(() => { clickedNode = false; }, 600); // Set timeout at 600 ms for double click detection
      }
    });

    // Show node name on hover
    flameNode.on('pointerover', (event) => {
      event.stopPropagation();

      tooltip.style.display = "inline";
      tooltip.innerText = "Node: " + node;
      tooltip.style.left = flameNode.x + (levelWidth / 2) + "px";
      tooltip.style.top = flameNode.y + "px";
    });

    // Hide node name after hover
    flameNode.on('pointerout', (event) => {
      event.stopPropagation();

      tooltip.style.display = "none";
    });
  }
},
});
</script>
