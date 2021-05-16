<template>
  <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  <p id="graph-tooltip" ref="graph-tooltip" style="position: absolute"></p>
</template>

<script lang="ts">
import { DefineComponent, defineComponent } from "vue";
import { Graph } from "graphology";
import { Node } from "graphology";
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { Graphics } from "pixi.js";
import '@pixi/graphics-extras';

export default defineComponent({
  mounted() {

    const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

    const app = new PIXI.Application({
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: true,
      //backgroundColor: 0xFFFFFF,
    });

    const defaultStyle = new PIXI.TextStyle({
      fill: "#000000",
    });

    const nodes = [
      { key: 25, attr: { name: "#1" } },
      { key: 2, attr: { name: "#2" } },
      { key: 3, attr: { name: "#three" } },
      { key: 4, attr: { name: "for" } },
      { key: 5, attr: { name: "5" } },
      { key: 6, attr: { name: "#8" } },
      { key: 7, attr: { name: "7" } },
      { key: 8, attr: { name: "8" } },
      { key: 9, attr: { name: "9" } },
      { key: 10, attr: { name: "ten" } },
      { key: 11, attr: { name: "XI" } },
      { key: 12, attr: { name: "twelve" } },
      { key: 13, attr: { name: "#thirteen" } },
      { key: 14, attr: { name: "XIV" } },
      { key: 15, attr: { name: "is" } },
      { key: 16, attr: { name: "16" } },
      { key: 17, attr: { name: "71" } },
      { key: 18, attr: { name: "19-1" } },
      { key: 19, attr: { name: "19-2" } },
      { key: 20, attr: { name: "#20" } },
    ];
    const edges = [
      { source: 25, target: 2, attr: {} },
      { source: 25, target: 3, attr: {} },
      { source: 6, target: 9, attr: {} },
      { source: 14, target: 16, attr: {} },
      { source: 2, target: 13, attr: {} },
      { source: 5, target: 18, attr: {} },
      { source: 20, target: 18, attr: {} },
      { source: 19, target: 6, attr: {} },
      { source: 2, target: 13, attr: {} },
      { source: 5, target: 18, attr: {} },
      { source: 20, target: 18, attr: {} },
      { source: 19, target: 6, attr: {} },
      { source: 2, target: 13, attr: {} },
      { source: 5, target: 18, attr: {} },
      { source: 20, target: 18, attr: {} },
      { source: 19, target: 6, attr: {} },
      { source: 17, target: 4, attr: {} },
      { source: 12, target: 15, attr: {} },
      { source: 11, target: 20, attr: {} },
      { source: 10, target: 17, attr: {} },
      { source: 9, target: 15, attr: {} },
      { source: 7, target: 8, attr: {} },
      { source: 4, target: 7, attr: {} },
      { source: 19, target: 6, attr: {} },
      { source: 17, target: 4, attr: {} },
      { source: 12, target: 15, attr: {} },
      { source: 11, target: 20, attr: {} },
      { source: 10, target: 17, attr: {} },
      { source: 9, target: 15, attr: {} },
      { source: 7, target: 8, attr: {} },
      { source: 4, target: 7, attr: {} },
      { source: 19, target: 6, attr: {} },
      { source: 17, target: 4, attr: {} },
      { source: 12, target: 15, attr: {} },
      { source: 11, target: 20, attr: {} },
      { source: 10, target: 17, attr: {} },
      { source: 9, target: 15, attr: {} },
      { source: 7, target: 8, attr: {} },
      { source: 4, target: 7, attr: {} },
      { source: 19, target: 6, attr: {} },
      { source: 17, target: 4, attr: {} },
      { source: 12, target: 15, attr: {} },
      { source: 11, target: 20, attr: {} },
      { source: 10, target: 17, attr: {} },
      { source: 9, target: 15, attr: {} },
      { source: 7, target: 8, attr: {} },
      { source: 4, target: 7, attr: {} },
      { source: 7, target: 10, attr: {} },
      { source: 10, target: 11, attr: {} }
    ];
    const input = {
      root: false, // false or root index
      height: 5, // >= 0
      graphType: "flame", // sumburst or flame or inverse-flame
      edgeType: "all", // all or incoming or outgoing
      widthType: "connections", // connections or subtree-size TODO
      minRenderSize: 0.001, // minimum render size
    };

    const graph = new Graph({
      multi: true,
    });

    for (const { key, attr } of nodes) {
      graph.addNode(key, attr);
    }
    for (const { source, target, attr } of edges) {
      graph.addDirectedEdge(source, target, attr);
    }

    var bothConnections = new Map();
    var outConnections = new Map();

    if (input.widthType == "connections") {
      [bothConnections, outConnections] = this.mapConnections(graph);
    }

    // give each node a corresponding index and corresponding text element
    let i = 0;
    graph.forEachNode((source: any, sourceAttr) => {
      const sourceString = source.toString();
      const text = new PIXI.Text(
        sourceString,
        defaultStyle,
      );
      text.anchor.set(0.5, 0.5);
      app.stage.addChild(text);
      this.nodeMap.set(source, {
        text: text,
        index: i,
      });
      i++;
    });

    this.draw(graph, app, input.root, input.height, input.graphType, input.edgeType, input.minRenderSize, bothConnections, outConnections);
  },

  data() {
    return {
      // node map
      nodeMap: new Map<number, {
        text: PIXI.Text,
        index: number,
      }>(),

      // the node that you're currently hovering over
      selectedIndex: null as number | null,
    };
  },

  methods: {
    mapConnections(graph: Graph) {
      var map_both = new Map();
      var map_out = new Map();

      // COUNT EDGES
      graph.forEachNode((node_1) => {
        graph.forEachNode((node_2) => {
          map_both.set(node_1 + "_" + node_2, graph.edges(node_1, node_2).length);
          map_out.set(node_1 + ">" + node_2, graph.outEdges(node_1, node_2).length);
        });
      });

      return [map_both, map_out];
    },

    /*mapSubtreeSize(graph: MultiGraph, root) {
      var map = new Map();
      return map;
    },*/

    draw(graph: Graph, app: PIXI.Application, root: any, height:any, graphType: any, edgeType: any, minRenderSize: any, bothConnections: any, outConnections: any) {
      const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
      const tooltip = this.$refs["graph-tooltip"] as HTMLElement;

      const graphics = new PIXI.Graphics();
      app.stage.addChild(graphics);

      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      var predecessors = [];

      var maxWidth;
      var maxHeight;
      var levelHeight;

      if (graphType == "sunburst") {
        maxWidth = Math.min(canvas.width, canvas.height) * .7;
        maxHeight = maxWidth;
        levelHeight = maxHeight / (2 * height);

        this.drawGraph(graph, app, root, height, graphType, edgeType, minRenderSize, bothConnections, outConnections, predecessors, 0, maxWidth, levelHeight, 0, 1, centerX, centerY, 0x4287f5);
      } else {
        var borderSize = Math.min(canvas.width, canvas.height) * .2;
        maxWidth = canvas.width - borderSize;
        maxHeight = canvas.height - borderSize;
        levelHeight = maxHeight / (height + 1);

        this.drawGraph(graph, app, root, height, graphType, edgeType, minRenderSize, bothConnections, outConnections, predecessors, 0, maxWidth, levelHeight, 0, 1, centerX, centerY, 0x4287f5);
      }
    },

  drawGraph(graph: Graph, app: PIXI.Application, node: any, height: any, graphType: any, edgeType: any, minRenderSize: any, bothConnections: any, outConnections: any, newPredecessors: any, level: any, maxWidth: any, levelHeight: any, drawStart: any, sizePerc: any, centerX: any, centerY: any, subtreeColour: any) {
    if (sizePerc >= minRenderSize) {
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

        var colours = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, nodesWithDegree + 1));

        let index = 0;

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

            var convertedColour = d3.color(colours(index)).formatHex().replace("#", "0x")

            predecessors = [];

            if (graphType == "sunburst") {
              level = 1
            }

            this.drawGraph(graph, app, node, height, graphType, edgeType, minRenderSize, bothConnections, outConnections, predecessors, level, maxWidth, levelHeight, drawStart, newSizePerc, centerX, centerY, convertedColour);
            drawStart += newSizePerc;
            index += 1;
          }
        });
      } else {

        if (graphType == "sunburst") {
          var startAngle = 2 * Math.PI * drawStart;
          var endAngle = 2 * Math.PI * (drawStart + sizePerc);
          this.drawNodeSunburst(app, centerX, centerY, level, levelHeight, startAngle, endAngle, subtreeColour);
        } else {
          var posX = centerX - (maxWidth / 2) + (maxWidth * drawStart);
          var posY;
          if (graphType == "flame") {
            posY = centerY + ((levelHeight * (height + 1)) / 2) - (levelHeight * level);
          } else {
            posY = centerY - ((levelHeight * (height + 1)) / 2) + (levelHeight * level);
          }
          this.drawNodeFlame(app, graphType, posX, posY, maxWidth * sizePerc, levelHeight, subtreeColour);
        }

        // Add this node to predecessors
        var predecessors = [...newPredecessors];
        predecessors.push(node);

        // Next layer
        if (level < height) {

          var downstreamConnections = 0;

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

          graph.forEachNeighbor(node, (neighbour, attributes) => {

            if (!this.isPredecessor(predecessors, neighbour)) {

              var newSizePerc = 0;

              if ((edgeType == 'incoming') && (outConnections.get(neighbour + ">" + node) > 0)) {
                newSizePerc = sizePerc * outConnections.get(neighbour + ">" + node) / downstreamConnections;

                this.drawGraph(graph, app, neighbour, height, graphType, edgeType, minRenderSize, bothConnections, outConnections, predecessors, level + 1, maxWidth, levelHeight, drawStart, newSizePerc, centerX, centerY, subtreeColour);
                drawStart += newSizePerc;

              } else if ((edgeType == 'outgoing') && (outConnections.get(node + ">" + neighbour) > 0)) {
                newSizePerc = sizePerc * outConnections.get(node + ">" + neighbour) / downstreamConnections;

                this.drawGraph(graph, app, neighbour, height, graphType, edgeType, minRenderSize, bothConnections, outConnections, predecessors, level + 1, maxWidth, levelHeight, drawStart, newSizePerc, centerX, centerY, subtreeColour);
                drawStart += newSizePerc;

              } else if ((edgeType != 'incoming') && (edgeType != 'outgoing') && (bothConnections.get(node + "_" + neighbour) > 0)) {
                newSizePerc = sizePerc * bothConnections.get(node + "_" + neighbour) / downstreamConnections;

                this.drawGraph(graph, app, neighbour, height, graphType, edgeType, minRenderSize, bothConnections, outConnections, predecessors, level + 1, maxWidth, levelHeight, drawStart, newSizePerc, centerX, centerY, subtreeColour);
                drawStart += newSizePerc;

              }
            }
          });
        }
      }
    }
  },

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
  drawNodeSunburst(app: PIXI.Application, centerX: any, centerY: any, level: any, levelHeight: any, startAngle: any, endAngle: any, nodeColour: any) {

    var minRadius = level * levelHeight;
    var maxRadius = minRadius + levelHeight;

    var sunburstNode = new PIXI.Graphics();

    sunburstNode.beginFill(nodeColour);
    sunburstNode.lineStyle(1, 0xFFFFFF);
    if (level == 0) {
      sunburstNode.drawCircle(centerX, centerY, maxRadius);
    } else {
      sunburstNode.drawTorus(centerX, centerY, minRadius, maxRadius, startAngle, endAngle);
    }
    sunburstNode.endFill();
    app.stage.addChild(sunburstNode);
  },

  // Draw node for flame graph
  drawNodeFlame(app: PIXI.Application, graphType: any, posX: any, posY: any, levelWidth: any, levelHeight: any, nodeColour: any) {

    var flameNode = new PIXI.Graphics();

    flameNode.beginFill(nodeColour);
    flameNode.lineStyle(1, 0xFFFFFF);
    if (graphType == "flame") {
      flameNode.drawRect(posX, (posY - levelHeight), levelWidth, levelHeight);
    } else {
      flameNode.drawRect(posX, posY, levelWidth, levelHeight);
    }
    flameNode.endFill();
    app.stage.addChild(flameNode);
  }
},
});
</script>
