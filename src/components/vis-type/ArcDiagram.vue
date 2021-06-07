<template>
  <div id="canvas-parent" ref="canvas-parent" style="height: 100%; width: 100%;">
    <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  </div>
  <p id="graph-tooltip" ref="graph-tooltip" style="position: fixed; user-select: none;"></p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as PIXI from "pixi.js";
import Graph from "graphology";
import { debounce } from "lodash";
import * as GlobalStorage from "@/scripts/globalstorage";
import { Viewport } from 'pixi-viewport';

// see also DiagramSettings.vue and UploadDataset.vue
type Settings = {
  name: string,
  variety: string, // "circle" or "line"
  hoverEdgeDirection: string,
};

export default defineComponent({
  props: {
    diagramid: {
      type: String,
      required: true,
    },
  },

  async mounted() {
    const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
    this.canvas = canvas;
    const canvasParent = this.$refs["canvas-parent"] as HTMLElement;

    const diagram = await GlobalStorage.getDiagram(this.diagramid);
    if (!diagram) {
      console.warn("Non-existent diagram ID:", this.diagramid);
      return;
    }
    this.diagram = diagram;

    const graph = await GlobalStorage.getDataset(this.diagram.graphID);
    if (!graph) {
      console.warn("Non-existent dataset:", this.diagram.graphID);
      return;
    }
    this.graph = graph;

    this.app = new PIXI.Application({
      view: canvas,
      antialias: true,
      backgroundAlpha: 0,
      resizeTo: canvasParent,
    });
    
    this.viewport = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        interaction: this.app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    })

    this.viewport.sortableChildren = true;
    // add the viewport to the stage
    this.app.stage.addChild(this.viewport as Viewport)

    //activate plugins
    this.viewport
        .drag()
        .wheel()
        //.decelerate() //this might lower perfomance a lot
        .clampZoom({maxScale:1});

    this.viewport.moveCenter(window.innerWidth / 2, window.innerHeight / 2)
    this.viewport.setZoom(0.5)
    const tooltip = this.$refs["graph-tooltip"] as HTMLElement;

    const defaultStyle = new PIXI.TextStyle({
      fill: "#000000",
    });
    
    // give each node a corresponding index and corresponding text element
    let i = 0;
    this.graph.forEachNode((source: any, sourceAttr) => {
      const sourceString = source.toString();
      const text = new PIXI.Text(sourceString, defaultStyle);
      text.anchor.set(0.5, 0.5);

      const edgeGraphics = new PIXI.Graphics();
      const circle = new PIXI.Graphics();

      // tooltip display
      circle.interactive = true;
      circle.buttonMode = true;
      circle.on("mouseover", (event) => {
        event.stopPropagation();

        tooltip.style.display = "inline";
        tooltip.innerText = "Node: " + sourceString;
        tooltip.style.left = (circle.x + 20) + "px";
        tooltip.style.top = (circle.y + 40) + "px";

        const color = 0x00D737;

        edgeGraphics.tint = color;
        edgeGraphics.alpha = 5;
        edgeGraphics.zIndex = 1;
        
        const callback = (target: any, targetAttributes: any) => {
          const targetData = this.nodeMap.get(target);
          if (!targetData) return;
          targetData.circle.tint = color;
          targetData.edgeGraphics.zIndex = 1;
        };
        const direction = diagram.settings.hoverEdgeDirection;
        if (direction === "outgoing" || direction === "both") {
          this.graph.forEachOutboundNeighbor(source, callback);
        }
        if (direction === "incoming" || direction === "both") {
          this.graph.forEachInboundNeighbor(source, callback);
        }

        circle.tint = 0xFE00EF;
      });

      circle.on("mouseout", (event) => {
        event.stopPropagation();

        tooltip.style.display = "none";

        const color = 0xffffff;
        circle.tint = color;

        edgeGraphics.tint = color;
        edgeGraphics.alpha = 1;
        edgeGraphics.zIndex = 0;

        const callback = (target: any, targetAttributes: any) => {
          const targetData = this.nodeMap.get(target);
          if (!targetData) return;
          targetData.circle.tint = color;
          targetData.edgeGraphics.zIndex = 0;
        };
        const direction = diagram.settings.hoverEdgeDirection;
        if (direction === "outgoing" || direction === "both") {
          this.graph.forEachOutboundNeighbor(source, callback);
        }
        if (direction === "incoming" || direction === "both") {
          this.graph.forEachInboundNeighbor(source, callback);
        }
      });

      this.nodeMap.set(source, {
        text: text,
        circle: circle,
        index: i,
        edgeGraphics: edgeGraphics,
      });
      i++;
    });

    // this has to happen next tick, otherwise the elements do not have their
    // size yet (because they've not been renderd yet)
    this.$nextTick(() => {
      const app = this.app as PIXI.Application;
      app.resize();

      diagram.onChange = (diagram, changedKey) => {
        this.draw(this.graph, app, diagram.settings, this.viewport as Viewport);
      };
      this.draw(this.graph, app, diagram.settings, this.viewport as Viewport);
    });
  },

  created(){
    window.addEventListener(
      "resize",
      debounce((event) => {
        if (!this.diagram) {
          return;
        }
        this.handleResize(event, this.graph, this.app as PIXI.Application, this.diagram.settings as Settings, this.viewport as Viewport);
      }, 250)
    )
  },
  
  data() {
    return {
      // node map
      nodeMap: new Map<number, {
        text: PIXI.Text,
        circle: PIXI.Graphics,
        index: number,
        edgeGraphics: PIXI.Graphics,
      }>(),

      // the node that you're currently hovering over
      selectedIndex: null as number | null,
      app: null as null | PIXI.Application,
      viewport: null as null | Viewport,
      graph: new Graph({
        //options
      }),
      diagram: null as GlobalStorage.Diagram | null,
      canvas: null as null | HTMLCanvasElement,
    };
  },

  methods: {
    handleResize(e: any, graph: Graph, app: PIXI.Application, settings: Settings, viewport: Viewport) {
      this.draw(graph, app, settings, viewport);
    },

    draw(graph: Graph, app: PIXI.Application, settings: Settings, viewport: Viewport) {
      const canvas = this.canvas as HTMLCanvasElement;
      
      //node radius has to be fixed size otherwise they become very small when adding too many nodes
      //const nodeRadius = graph.order == 0 ? 200 : Math.floor(500 / graph.order);
      const nodeRadius = 10;
      //---------------------------------------------
      
      const textStyle = new PIXI.TextStyle({
        fill: "#000000",
        fontSize: nodeRadius + 4,
      });
      const direction = settings.hoverEdgeDirection;
      const drawOutgoing = direction === "outgoing" || direction === "both";
      const drawIncoming = direction === "incoming" || direction === "both";
      const alpha = (drawOutgoing && drawIncoming) ? 0.1 : 0.2;

      viewport.removeChildren();
      
      // NOTE: some forEach* callbacks have ": any", because graphology lies
      // about its types :(
      if (!settings.variety || settings.variety === "circle") {
        const textDistance = 40;
        const vertexRadius = Math.min(canvas.width, canvas.height) - textDistance;
        const angle = 2 * Math.PI / (graph.order == 0 ? 1 : graph.order);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        graph.forEachNode((source: any, sourceAttr) => {
          const sourceData = this.nodeMap.get(source);
          if (typeof sourceData === "undefined") return; // not supposed to happen

          const text = sourceData.text;
          text.style = textStyle;
          text.x = centerX + (vertexRadius + textDistance) * Math.cos(sourceData.index * angle);
          text.y = centerY + (vertexRadius + textDistance) * Math.sin(sourceData.index * angle);

          viewport.addChild(text);

          const circle = sourceData.circle;
          circle.clear();
          circle.lineStyle(1);
          circle.beginFill(0x50D5E8, 1);
          circle.drawCircle(0, 0, nodeRadius);
          circle.endFill();
          circle.x = centerX + vertexRadius * Math.cos(sourceData.index * angle);
          circle.y = centerY + vertexRadius * Math.sin(sourceData.index * angle);
          viewport.addChild(circle);

          const edgeGraphics = sourceData.edgeGraphics;
          edgeGraphics.clear();

          const fromX = centerX + vertexRadius * Math.cos(sourceData.index * angle);
          const fromY = centerY + vertexRadius * Math.sin(sourceData.index * angle);

          // draw outgoing edges
          const callback = (target: any, attributes: any) => {
            const targetData = this.nodeMap.get(target);
            if (typeof targetData === "undefined") return;

            const toX = centerX + vertexRadius * Math.cos(targetData.index * angle);
            const toY = centerY + vertexRadius * Math.sin(targetData.index * angle);

            edgeGraphics
              .lineStyle(2, 0xE06776, alpha)
              .moveTo(fromX, fromY)
              .quadraticCurveTo(centerX, centerY, toX, toY);
          };
          if (drawOutgoing) {
            graph.forEachOutboundNeighbor(source, callback);
          }
          if (drawIncoming) {
            graph.forEachInboundNeighbor(source, callback);
          }

          viewport.addChild(edgeGraphics);
        });
      } else if (settings.variety === "line"){
        const nodeLineY = canvas.height * 5/6;
        const nodeLineX = canvas.width * 1/10;
        //let gap = Math.floor(canvas.width/(1.2 * graph.order));
        let gap = 30;

        // draw every node
        graph.forEachNode((source: any, sourceAttr) => {
          const sourceData = this.nodeMap.get(source);
          if (!sourceData) return; // not supposed to happen

          const circle = sourceData.circle;
          circle.clear();
          circle.lineStyle(1);
          circle.beginFill(0x50D5E8, 1);
          circle.drawCircle(0, 0, nodeRadius);
          circle.endFill();
          circle.x = nodeLineX + gap * sourceData.index;
          circle.y = nodeLineY;

          // node's value
          const text = sourceData.text;
          text.style = textStyle;
          text.x = circle.x;
          text.y = circle.y + nodeRadius + text.height;

          viewport.addChild(circle, text);
        });
        // draw every edge
        graph.forEachNode((source: any, sourceAttr) => {
          const sourceData = this.nodeMap.get(source);
          if (!sourceData) return;

          const edgeGraphics = sourceData.edgeGraphics;
          edgeGraphics.clear();

          const sourceX = sourceData.circle.x;
          const sourceY = sourceData.circle.y;
          const callback = (target: any, targetAttributes: any) => {
            const targetData = this.nodeMap.get(target);
            if (!targetData) return; // shouldn't happen

            const targetX = targetData.circle.x;
            const radius = Math.abs(sourceX - targetX) / 2;
            const xArcCenter = (sourceX + targetX) / 2;

            edgeGraphics
              .lineStyle(2, 0xE06776, alpha)
              .arc(xArcCenter, sourceY, radius, Math.PI, 2 * Math.PI);
          };
          if (drawOutgoing) {
            graph.forEachOutboundNeighbor(source, callback);
          }
          if (drawIncoming) {
            graph.forEachInboundNeighbor(source, callback);
          }

          viewport.addChild(edgeGraphics);
        });
      } else {
        console.warn("Unrecognized shape", settings.variety);
      }
    }
  },
});
</script>
