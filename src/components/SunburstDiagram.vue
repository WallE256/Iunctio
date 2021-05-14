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
      { source: 4, target: 7, attr: {} }
    ];
    const input = {
      edgeType: "all", // or incoming or outgoing
      widthType: "connections", // or subtree-size
      graphType: "sunburst", // or flame
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

    var root = false;

    var totalRadius = 400;

    var height = 5;

    this.draw(graph, app, bothConnections, outConnections, root, height, totalRadius, input.edgeType);
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

    draw(graph: Graph, app: PIXI.Application, bothConnections: any, outConnections: any, root: any, height: any, totalRadius: any, edgeType: any) {
      const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;

      const tooltip = this.$refs["graph-tooltip"] as HTMLElement;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      var levelRadius = totalRadius / (height + 1);

      const graphics = new PIXI.Graphics();
      app.stage.addChild(graphics);

      var predecessors = [];

      this.drawGraph(graph, app, bothConnections, outConnections, predecessors, edgeType, root, height, 0, levelRadius, 0, 1, centerX, centerY, 0x00BB00);
    },

  drawGraph(graph: Graph, app: PIXI.Application, bothConnections: any, outConnections: any, predecessors: any, edgeType: any, node: any, height: any, level: any, levelRadius: any, drawStart: any, size: any, centerX: any, centerY: any, nodeColour: any) {

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

        var newSize = 0;

        if (edgeType == 'incoming') {
          newSize = graph.inDegree(node);
        } else if (edgeType == 'outgoing') {
          newSize = graph.outDegree(node);
        } else {
          newSize = graph.degree(node);
        }

        if (newSize > 0) {

          newSize /= totalDegree;

          var convertedColour = d3.color(colours(index)).formatHex().replace("#", "0x")

          predecessors = [];

          this.drawGraph(graph, app, bothConnections, outConnections, predecessors, edgeType, node, height, 1, levelRadius, drawStart, newSize, centerX, centerY, convertedColour);
          drawStart += newSize;
          index += 1;
        }
      });
    } else {

      var minPosition = drawStart;
      var maxPosition = drawStart + size;
      var startAngle = 2 * Math.PI * drawStart;
      var endAngle = 2 * Math.PI * (drawStart + size);

      this.drawNodeSunburst(app, nodeColour, centerX, centerY, level, levelRadius, startAngle, endAngle);

      // Add this node to predecessors
      predecessors.push(node);

      // Next layer
      if (level < height) {

        var downstreamConnections = 0;

        graph.forEachNeighbor(node, (neighbour, attributes) => {

          var isPredecessor = false;

          for (let index = 0; index < predecessors.length; index++) {
            if (predecessors[index] == neighbour) {
              isPredecessor = true;
            }
          }

          if (!isPredecessor) {

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

          var isPredecessor = false;

          for (let index = 0; index < predecessors.length; index++) {
            if (predecessors[index] == neighbour) {
              isPredecessor = true;
            }
          }

          if (!isPredecessor) {

            var newSize = 0;

            if ((edgeType == 'incoming') && (outConnections.get(neighbour + ">" + node) > 0)) {
              newSize = size * outConnections.get(neighbour + ">" + node) / downstreamConnections;

              this.drawGraph(graph, app, bothConnections, outConnections, predecessors, edgeType, neighbour, height, level + 1, levelRadius, drawStart, newSize, centerX, centerY, nodeColour);
              drawStart += newSize;

            } else if ((edgeType == 'outgoing') && (outConnections.get(node + ">" + neighbour) > 0)) {
              newSize = size * outConnections.get(node + ">" + neighbour) / downstreamConnections;

              this.drawGraph(graph, app, bothConnections, outConnections, predecessors, edgeType, neighbour, height, level + 1, levelRadius, drawStart, newSize, centerX, centerY, nodeColour);
              drawStart += newSize;

            } else if ((edgeType != 'incoming') && (edgeType != 'outgoing') && (bothConnections.get(node + "_" + neighbour) > 0)) {
              newSize = size * bothConnections.get(node + "_" + neighbour) / downstreamConnections;

              this.drawGraph(graph, app, bothConnections, outConnections, predecessors, edgeType, neighbour, height, level + 1, levelRadius, drawStart, newSize, centerX, centerY, nodeColour);
              drawStart += newSize;

            }
          }
        });
      }
    }
  },

  drawNodeSunburst(app: PIXI.Application, nodeColour: any, centerX: any, centerY: any, level: any, levelRadius: any, startAngle: any, endAngle: any) {

    // drawGraph
    var minRadius = level * levelRadius;
    var maxRadius = minRadius + levelRadius;

    var arcCircle = new PIXI.Graphics();

    arcCircle.beginFill(nodeColour);
    arcCircle.lineStyle(1.2, 0xFFFFFF);
    if (level == 0) {
      arcCircle.drawCircle(centerX, centerY, maxRadius);
    } else {
      arcCircle.drawTorus(centerX, centerY, minRadius, maxRadius, startAngle, endAngle);
    }
    arcCircle.endFill();
    app.stage.addChild(arcCircle);
  }
},
});
</script>
