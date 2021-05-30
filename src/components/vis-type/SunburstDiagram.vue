<template>
  <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  <p id="graph-tooltip" ref="graph-tooltip" style="position: fixed; user-select: none;"></p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Graph from "graphology";
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import * as GlobalStorage from "@/scripts/globalstorage";

var graph = new Graph();
var app;
let tooltip = document.createElement('null');

// Create map for number of connections between nodes
var bothConnections = new Map();
var outConnections = new Map();

const input = {
  root: false, // false or root index
  height: 5, // >= 0
  graphType: "sunburst", // sunburst or flame or inverse-flame
  edgeType: "all", // all or incoming or outgoing
  widthType: "connections", // connections or subtree-size TODO
  minRenderSize: 0.001, // minimum render size
};

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

export default defineComponent({
  props: {
    diagramid: {
      type: String,
      required: true,
    },
  },

  mounted() {
    const diagram = GlobalStorage.getDiagram(this.diagramid);
    if (!diagram) {
      console.warn("Non-existent diagram:", this.diagramid);
      return;
    }
    graph = (GlobalStorage.getDataset(diagram.graphID) as Graph);
    if (!graph) {
      console.warn("Non-existent dataset:", diagram.graphID);
      return;
    }

    const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
    tooltip = this.$refs["graph-tooltip"] as HTMLElement;

    const app = new PIXI.Application({
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: true,
    });

    const defaultStyle = new PIXI.TextStyle({
      fill: "#000000",
    });

    if (input.widthType == "connections") {
      [bothConnections, outConnections] = this.mapConnections(graph);
    }

    // Draw the diagram
    this.draw(graph, app, input.root, input.height, input.graphType, input.edgeType, input.minRenderSize, bothConnections, outConnections, 0x4287f5);
  },

  data() {
    return {
      // the node that you're currently hovering over
      selectedIndex: null as number | null,
    };
  },

  methods: {

    // Create map of connections between nodes
    mapConnections(graph: Graph) {
      var map_both = new Map();
      var map_out = new Map();

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
    draw(graph: Graph, app: PIXI.Application, root: any, height:any, graphType: any, edgeType: any, minRenderSize: any, bothConnections: any, outConnections: any, nodeColour: any) {
      const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
      const tooltip = this.$refs["graph-tooltip"] as HTMLElement;

      app.stage.removeChildren();

      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      let predecessors = [] as any[];

      var maxWidth;
      var maxHeight;
      var levelHeight;

      // Calculate height based on graph type
      if (graphType == "sunburst") {
        maxWidth = Math.min(canvas.width, canvas.height) * .7;
        maxHeight = maxWidth;
        levelHeight = maxHeight / (2 * height);

        this.drawDiagram(graph, app, root, height, graphType, edgeType, minRenderSize, bothConnections, outConnections, predecessors, 0, maxWidth, levelHeight, 0, 1, centerX, centerY, nodeColour);
      } else {
        var borderSize = Math.min(canvas.width, canvas.height) * .2;
        maxWidth = canvas.width - borderSize;
        maxHeight = canvas.height - borderSize;
        levelHeight = maxHeight / (height + 1);

        this.drawDiagram(graph, app, root, height, graphType, edgeType, minRenderSize, bothConnections, outConnections, predecessors, 0, maxWidth, levelHeight, 0, 1, centerX, centerY, nodeColour);
      }
    },

  // Draw the subtree of given diagram
  drawDiagram(graph: Graph, app: PIXI.Application, node: any, height: any, graphType: any, edgeType: any, minRenderSize: any, bothConnections: any, outConnections: any, newPredecessors: any, level: any, maxWidth: any, levelHeight: any, drawStart: any, sizePerc: any, centerX: any, centerY: any, subtreeColour: any) {

    // Only draw if the node is rendered wide enough
    if (sizePerc >= minRenderSize) {

      // If no node is given (so no root was selected)
      if (!node) {
        var totalDegree = 0;
        var nodesWithDegree = 0;

        // Calculate total degree for all nodes
        graph.forEachNode((node, attributes) => {
          if (edgeType == 'incoming') {
            if (graph.inDegree(node) > 0) {
              nodesWithDegree += 1;
              totalDegree += graph.inDegree(node);
            }
          } else if (edgeType == 'outgoing') {
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

          if (edgeType == 'incoming') {
            newSizePerc = graph.inDegree(node);
          } else if (edgeType == 'outgoing') {
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
            if (graphType == "sunburst") {
              level = 1
            }

            this.drawDiagram(graph, app, node, height, graphType, edgeType, minRenderSize, bothConnections, outConnections, predecessors, level, maxWidth, levelHeight, drawStart, newSizePerc, centerX, centerY, convertedColour);
            drawStart += newSizePerc;
            index += 1;
          }
        });
      } else {

        // Draw node
        if (graphType == "sunburst") {
          this.drawNodeSunburst(app, node, centerX, centerY, level, levelHeight, drawStart, sizePerc, subtreeColour);
        } else {
          this.drawNodeFlame(app, graphType, node, centerX, centerY, maxWidth, drawStart, sizePerc, height, level, levelHeight, subtreeColour);
        }

        // Add this node to copy of predecessors
        var predecessors = [...newPredecessors];
        predecessors.push(node);

        // Next layer
        if (level < height) {

          var downstreamConnections = 0;

          // Count downstream connections
          graph.forEachNeighbor(node, (neighbour, attributes) => {

            if (!this.isPredecessor(predecessors, neighbour)) {

              if (edgeType == 'incoming') {
                downstreamConnections += outConnections.get(neighbour + ">" + node);
              } else if (edgeType == 'outgoing') {
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

              if ((edgeType == 'incoming') && (outConnections.get(neighbour + ">" + node) > 0)) {
                newSizePerc = sizePerc * outConnections.get(neighbour + ">" + node) / downstreamConnections;

                this.drawDiagram(graph, app, neighbour, height, graphType, edgeType, minRenderSize, bothConnections, outConnections, predecessors, level + 1, maxWidth, levelHeight, drawStart, newSizePerc, centerX, centerY, subtreeColour);
                drawStart += newSizePerc;

              } else if ((edgeType == 'outgoing') && (outConnections.get(node + ">" + neighbour) > 0)) {
                newSizePerc = sizePerc * outConnections.get(node + ">" + neighbour) / downstreamConnections;

                this.drawDiagram(graph, app, neighbour, height, graphType, edgeType, minRenderSize, bothConnections, outConnections, predecessors, level + 1, maxWidth, levelHeight, drawStart, newSizePerc, centerX, centerY, subtreeColour);
                drawStart += newSizePerc;

              } else if ((edgeType != 'incoming') && (edgeType != 'outgoing') && (bothConnections.get(node + "_" + neighbour) > 0)) {
                newSizePerc = sizePerc * bothConnections.get(node + "_" + neighbour) / downstreamConnections;

                this.drawDiagram(graph, app, neighbour, height, graphType, edgeType, minRenderSize, bothConnections, outConnections, predecessors, level + 1, maxWidth, levelHeight, drawStart, newSizePerc, centerX, centerY, subtreeColour);
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
  drawNodeSunburst(app: PIXI.Application, node: any, centerX: any, centerY: any, level: any, levelHeight: any, drawStart: any, sizePerc: any, nodeColour: any) {

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

      // Reset graph is the user presses the node in the middle
      if (level == 0) {
        this.draw(graph, app, false, input.height, input.graphType, input.edgeType, input.minRenderSize, bothConnections, outConnections, nodeColour);
      } else {
        this.draw(graph, app, node, input.height, input.graphType, input.edgeType, input.minRenderSize, bothConnections, outConnections, nodeColour);
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
  drawNodeFlame(app: PIXI.Application, graphType: any, node: any, centerX: any, centerY: any, maxWidth: any, drawStart: any, sizePerc: any, height: any, level: any, levelHeight: any, nodeColour: any) {
    var posX = centerX - (maxWidth / 2) + (maxWidth * drawStart);
    var posY = 0;
    if (graphType == "flame") {
      posY = centerY + ((levelHeight * (height + 1)) / 2) - (levelHeight * (level + 1));
    } else {
      posY = centerY - ((levelHeight * (height + 1)) / 2) + (levelHeight * (level + 1));
    }
    var levelWidth = maxWidth * sizePerc;

    const flameNode = new PIXI.Graphics();

    flameNode.beginFill(nodeColour);
    flameNode.lineStyle(1, 0xFFFFFF);
    if (graphType == "flame") {
      flameNode.drawRect(0, 0, levelWidth, levelHeight);
    } else {
      flameNode.drawRect(0, 0, levelWidth, levelHeight);
    }
    flameNode.endFill();
    flameNode.x = posX;
    flameNode.y = posY;
    app.stage.addChild(flameNode);

    // Interactivity
    flameNode.interactive = true;
    flameNode.buttonMode = true;

    // Set root on click
    flameNode.on('pointerdown', (event) => {
      event.stopPropagation();

      // Reset graph is the user presses the node in the middle
      if ((level == 0) && (sizePerc == 1)) {
        this.draw(graph, app, false, input.height, input.graphType, input.edgeType, input.minRenderSize, bothConnections, outConnections, nodeColour);
      } else {
        this.draw(graph, app, node, input.height, input.graphType, input.edgeType, input.minRenderSize, bothConnections, outConnections, nodeColour);
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
