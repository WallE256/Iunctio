<template>
  <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  <p id="graph-tooltip" ref="graph-tooltip" style="position: absolute"></p>
</template>

<script lang="ts">
import { DefineComponent, defineComponent } from "vue";
import DirectedGraph from "graphology";
import Node from "graphology";
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import { Graphics } from "pixi.js";
import '@pixi/graphics-extras';

export default defineComponent({
  mounted() {
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
      { source: 20, target: 18, attr: {} }
    ];
    const input = {
      edgeType: "all", // or incoming or outgoing
    };

    const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

    const graph = new DirectedGraph({
      //options
    });

    for (const { key, attr } of nodes) {
      graph.addNode(key, attr);
    }
    for (const { source, target, attr } of edges) {
      graph.addDirectedEdge(source, target, attr);
    }

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

    this.draw(graph, app, root, height, totalRadius, input.edgeType);
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
    draw(graph: DirectedGraph, app: PIXI.Application, root: any, height: any, totalRadius: any, edgeType: any) {
      const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;

      const tooltip = this.$refs["graph-tooltip"] as HTMLElement;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      var levelRadius = totalRadius / (height + 1);

      const graphics = new PIXI.Graphics();
      app.stage.addChild(graphics);

      if (root) {
        this.drawnode(graph, app, edgeType, root, height, 0, levelRadius, 0, 1, centerX, centerY, 0x00BB00);
      } else {
        var totalDegree = 0;
        var nodesWithDegree = 0;
        var drawStart = 0;

        // Calculate total degree for the neighbour nodes
        graph.forEachNode((node, attributes) => {
          if (edgeType == 'incoming') {
            totalDegree += graph.inDegree(node);
            if (graph.inDegree(node) > 0) {
              nodesWithDegree += 1;
            }
          } else if (edgeType == 'outgoing') {
            totalDegree += graph.outDegree(node);
            if (graph.outDegree(node) > 0) {
              nodesWithDegree += 1;
            }
          } else {
            totalDegree += graph.degree(node);
            if (graph.degree(node) > 0) {
              nodesWithDegree += 1;
            }
          }
        });

        var colours = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, nodesWithDegree + 1));

        var index = 0;

        graph.forEachNode((node, attributes) => {

          if (((edgeType == 'incoming') && (graph.inDegree(node) > 0)) || ((edgeType == 'outgoing') && (graph.outDegree(node) > 0)) || ((edgeType != 'incoming') && (edgeType != 'outgoing') && (graph.degree(node) > 0))) {

            var newSize = 0;

            if (edgeType == 'incoming') {
              newSize = graph.inDegree(node);
            } else if (edgeType == 'outgoing') {
              newSize = graph.outDegree(node);
            } else {
              newSize = graph.degree(node);
            }

            newSize /= totalDegree;

            var convertedColour = d3.color(colours(index)).formatHex().replace("#", "0x")

            this.drawnode(graph, app, edgeType, node, height, 1, levelRadius, drawStart, newSize, centerX, centerY, convertedColour);
            drawStart += newSize;
            index += 1;
          }
        });
      }
    },

  drawnode (graph: DirectedGraph, app: PIXI.Application, edgeType: any, node: any, height: any, level: any, levelRadius: any, drawStart: any, size: any, centerX: any, centerY: any, nodeColour: any) {

    // drawnode
    var minRadius = level * levelRadius;
    var maxRadius = minRadius + levelRadius;
    var minPosition = drawStart;
    var maxPosition = drawStart + size;
    var startAngle = 2 * Math.PI * drawStart;
    var endAngle = 2 * Math.PI * (drawStart + size);

    // Draw next layer
    if (level < height) {

      var totalDegree = 0;

      // Calculate total degree for the neighbour nodes
      graph.forEachNeighbor(node, function(neighbour, attributes) {
        if (edgeType == 'incoming') {
          totalDegree += graph.inDegree(neighbour);
        } else if (edgeType == 'outgoing') {
          totalDegree += graph.outDegree(neighbour);
        } else {
          totalDegree += graph.degree(neighbour);
        }
      });

      graph.forEachNeighbor(node, (neighbour, attributes) => {
        var newSize = size / totalDegree;

        if (edgeType == 'incoming') {
          newSize *= graph.inDegree(neighbour);
        } else if (edgeType == 'outgoing') {
          newSize *= graph.outDegree(neighbour);
        } else {
          newSize *= graph.degree(neighbour);
        }

        this.drawnode(graph, app, edgeType, neighbour, height, level + 1, levelRadius, drawStart, newSize, centerX, centerY, nodeColour);
        drawStart += newSize;
      });
    }

    var arcCircle = new PIXI.Graphics();

    arcCircle.beginFill(nodeColour);
    arcCircle.lineStyle(2, 0xFFFFFF);
    arcCircle.drawTorus(centerX, centerY, minRadius, maxRadius, startAngle, endAngle);
    arcCircle.endFill();
    app.stage.addChild(arcCircle);
  }
},
});
</script>
