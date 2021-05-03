<template>
  <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as PIXI from "pixi.js";
import Graph from "graphology";

export default defineComponent({
  mounted() {
    const graph = new Graph<number, number, number>();
    //graph.addNode(2);
    const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

    const vertices = new Map([
      [25, { name: "#1", index: 0 }],
      [2, { name: "#2", index: 0 }],
      [3, { name: "#three", index: 0 }],
      [4, { name: "for", index: 0 }],
      [5, { name: "5", index: 0 }],
      [6, { name: "#8", index: 0 }],
      [7, { name: "7", index: 0 }],
      [8, { name: "8", index: 0 }],
      [9, { name: "9", index: 0 }],
      [10, { name: "ten", index: 0 }],
      [11, { name: "XI", index: 0 }],
      [12, { name: "twelve", index: 0 }],
      [13, { name: "#thirteen", index: 0 }],
      [14, { name: "XIV", index: 0 }],
      [15, { name: "is", index: 0 }],
      [16, { name: "16", index: 0 }],
      [17, { name: "71", index: 0 }],
      [18, { name: "19-1", index: 0 }],
      [19, { name: "19-2", index: 0 }],
      [20, { name: "#20", index: 0 }],
    ]);
    const edges = new Map([
      [25, [2, 3]],
      [6, [9]],
      [14, [16]],
      [2, [13]],
      [5, [18]],
    ]);
    const vertexRadius = 240;
    const angle = (2 * Math.PI) / vertices.size;

    const app = new PIXI.Application({
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: true,
    });

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const graphics = new PIXI.Graphics();
    app.stage.addChild(graphics);

    let i = 0;
    for (const [key, value] of vertices) {
      value.index = i;
      const text = new PIXI.Text(
        key.toString(),
        new PIXI.TextStyle({
          fill: "#00FF00",
        })
      );
      text.anchor.set(0.5, 0.5);
      text.x = centerX + vertexRadius * Math.cos(i * angle);
      text.y = centerY + vertexRadius * Math.sin(i * angle);
      app.stage.addChild(text);
      i++;
    }

    //app.ticker.add(function() {
    // https://pixijs.download/release/docs/PIXI.Graphics.html
    graphics.clear();

    const edgeRadius = vertexRadius - 20;
    for (const [from, targets] of edges) {
      const fromVertex = vertices.get(from);
      if (typeof fromVertex === "undefined") {
        continue;
      }
      const fromX = centerX + edgeRadius * Math.cos(fromVertex.index * angle);
      const fromY = centerY + edgeRadius * Math.sin(fromVertex.index * angle);
      for (const to of targets) {
        const toVertex = vertices.get(to);
        if (typeof toVertex === "undefined") {
          continue;
        }
        const toX = centerX + edgeRadius * Math.cos(toVertex.index * angle);
        const toY = centerY + edgeRadius * Math.sin(toVertex.index * angle);
        graphics
          .lineStyle(2, 0xff0000)
          .moveTo(fromX, fromY)
          .quadraticCurveTo(centerX, centerY, toX, toY);
      }
    }
    //});
  },
});
</script>
