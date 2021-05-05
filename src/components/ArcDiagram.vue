<template>
  <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as PIXI from "pixi.js";
import DirectedGraph from "graphology";
import Node from "graphology";

export default defineComponent({
  mounted() {
    const nodes = [
      { key: 25, attr: { name: "#1", index: 0 } },
      { key: 2, attr: { name: "#2", index: 0 } },
      { key: 3, attr: { name: "#three", index: 0 } },
      { key: 4, attr: { name: "for", index: 0 } },
      { key: 5, attr: { name: "5", index: 0 } },
      { key: 6, attr: { name: "#8", index: 0 } },
      { key: 7, attr: { name: "7", index: 0 } },
      { key: 8, attr: { name: "8", index: 0 } },
      { key: 9, attr: { name: "9", index: 0 } },
      { key: 10, attr: { name: "ten", index: 0 } },
      { key: 11, attr: { name: "XI", index: 0 } },
      { key: 12, attr: { name: "twelve", index: 0 } },
      { key: 13, attr: { name: "#thirteen", index: 0 } },
      { key: 14, attr: { name: "XIV", index: 0 } },
      { key: 15, attr: { name: "is", index: 0 } },
      { key: 16, attr: { name: "16", index: 0 } },
      { key: 17, attr: { name: "71", index: 0 } },
      { key: 18, attr: { name: "19-1", index: 0 } },
      { key: 19, attr: { name: "19-2", index: 0 } },
      { key: 20, attr: { name: "#20", index: 0 } },
    ];
    const edges = [
      { source: 25, target: 2, attr: {} },
      { source: 25, target: 3, attr: {} },
      { source: 6, target: 9, attr: {} },
      { source: 14, target: 16, attr: {} },
      { source: 2, target: 13, attr: {} },
      { source: 5, target: 18, attr: {} },
    ];
    const input = {
      shape: "circle", // or line
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

    // give each node an index
    let i = 0;
    graph.forEachNode((source, sourceAttr) => {
      sourceAttr.index = i;
      i++;
    });

    const app = new PIXI.Application({
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: true,
    });

    this.draw(graph, app, input.shape === "circle");
  },

  methods: {
    draw(graph: DirectedGraph, app: PIXI.Application, circle: boolean) {
      const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
      const vertexRadius = 240;
      const edgeRadius = vertexRadius - 20;
      const angle = (2 * Math.PI) / graph.order;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      app.stage.removeChildren();

      // https://pixijs.download/release/docs/PIXI.Graphics.html
      const graphics = new PIXI.Graphics();
      app.stage.addChild(graphics);

      if (circle) {
        graph.forEachNode((source, sourceAttr) => {
          const text = new PIXI.Text(
            source.toString(),
            new PIXI.TextStyle({
              fill: "#00FF00",
            })
          );
          text.anchor.set(0.5, 0.5);
          text.x = centerX + vertexRadius * Math.cos(sourceAttr.index * angle);
          text.y = centerY + vertexRadius * Math.sin(sourceAttr.index * angle);
          app.stage.addChild(text);

          // draw outgoing edges
          graph.forEachOutboundNeighbor(source, (target, targetAttr) => {
            const fromX = centerX + edgeRadius * Math.cos(sourceAttr.index * angle);
            const fromY = centerY + edgeRadius * Math.sin(sourceAttr.index * angle);
            const toX = centerX + edgeRadius * Math.cos(targetAttr.index * angle);
            const toY = centerY + edgeRadius * Math.sin(targetAttr.index * angle);
            graphics
              .lineStyle(2, 0xff0000)
              .moveTo(fromX, fromY)
              .quadraticCurveTo(centerX, centerY, toX, toY);
          }); 
        });
      } else {
        // TODO
      }
    }
  },
});
</script>
