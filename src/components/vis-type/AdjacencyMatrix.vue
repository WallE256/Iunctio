<template>
  <div id="canvas-parent" ref="canvas-parent" style="height: 100%; width: 100%;">
    <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  </div>
  <p id="graph-tooltip" ref="graph-tooltip" style="position: fixed; user-select: none;"></p>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import * as PIXI from "pixi.js";
import Graph from "graphology";
import { debounce } from "lodash";
import * as GlobalStorage from "@/scripts/globalstorage";
import { Viewport } from 'pixi-viewport';

type Settings = {
  variety?: string, // "edge-frequency" or "sentiment"
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
      const rectangle = new PIXI.Graphics();

      this.nodeMap.set(source, {
        text: text,
        rectangle: rectangle,
        index: i,
      });
      i++;
    });

    this.matrix.length = graph.order;

    for(let i = 0; i < graph.order; i++) {
      this.matrix[i] = Array.from({ length: graph.order }, () => new PIXI.Graphics())
    }

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
      nodeMap: new Map<number, {
        text: PIXI.Text,
        rectangle: PIXI.Graphics,
        index: number,
      }>(),

      app: null as null | PIXI.Application,
      viewport: null as null | Viewport,
      graph: new Graph({
      }),

      matrix: [] as PIXI.Graphics[][],

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
      const textStyle = new PIXI.TextStyle({
        fill: "#000000",
        fontSize: 12,
      });
      viewport.removeChildren();

      const nodeY = canvas.height * 1/5;
      const nodeX = canvas.width * 1/10;
      const rectWidth = 17;
      const rectHeight = 17;
      let gap = 17;
      let maxEdges = 0;

      if (settings.variety === "edge-frequency") {
        graph.forEachNode((node_1: any) => {
          graph.forEachNode((node_2: any) => {
            if (maxEdges < graph.outEdges(node_1, node_2).length)
            {
              maxEdges = graph.outEdges(node_1, node_2).length;
            }
          });
        }); 
        maxEdges = Math.log(maxEdges);
      }

      graph.forEachNode((node_1: any) => {
        const sourceData1 = this.nodeMap.get(node_1);
        if (!sourceData1) return;

        graph.forEachNode((node_2: any) => {
          const sourceData2 = this.nodeMap.get(node_2);
          if (!sourceData2) return; // not supposed to happen

          const rectangle = this.matrix[sourceData1.index][sourceData2.index];
          rectangle.lineStyle(1);

          if (graph.hasEdge(node_1, node_2)) {
            
            if (settings.variety === "edge-frequency") {
              rectangle.beginFill(0xAF1A1A, 1);
              rectangle.alpha = (Math.log(graph.outEdges(node_1, node_2).length) / maxEdges) * 0.8 + 0.2;
            } else if (settings.variety === "sentiment") {

              let avgSentiment = 0;
              let sentimentSum = 0; 
              for(let edge of graph.outEdges(node_1, node_2)) {
                sentimentSum += graph.getEdgeAttributes(edge)["sentiment"];
              }
              avgSentiment = sentimentSum / graph.outEdges(node_1, node_2).length;

              if (avgSentiment > 0) {
                rectangle.beginFill(0x337F1E, 1);
              } else if (avgSentiment < 0) {
                rectangle.beginFill(0xAF1A1A, 1);
              } else if (avgSentiment == 0) {
                rectangle.beginFill(0xFCFFA5, 1);
              }

              rectangle.alpha = Math.abs(avgSentiment * 0.2 + 0.8);
            }

          } else {
            rectangle.beginFill(0xC0C0C0, 1);
          }
          rectangle.drawRect(0, 0, rectWidth, rectHeight);
          rectangle.endFill();

          rectangle.interactive = true;
          // rectangle.buttonMode = true;
          rectangle.on("mouseover", (event) => {
            event.stopPropagation();

            for(let i = 0; i < graph.order; i++) {
              this.matrix[sourceData1.index][i].tint = 0xFE00EF;
              this.matrix[i][sourceData2.index].tint = 0xFE00EF;
            }
          });

          rectangle.on("mouseout", (event) => {
            event.stopPropagation();

            for(let i = 0; i < graph.order; i++) {
              this.matrix[sourceData1.index][i].tint = 0xFFFFFF;
              this.matrix[i][sourceData2.index].tint = 0xFFFFFF;
            }
          });

          rectangle.x = nodeX + (gap * sourceData2.index);
          rectangle.y = nodeY + (gap * sourceData1.index);

          viewport.addChild(rectangle as PIXI.Graphics);
        });    
      });

      // Display fromId for the row node
      graph.forEachNode((node: any) => {
        const sourceData = this.nodeMap.get(node);
        if (!sourceData) return;

        const textX = new PIXI.Text(node);
        textX.style = textStyle;
        textX.x = nodeX - (rectWidth / 2);
        textX.y = nodeY + (rectHeight / 2) + (gap * sourceData.index);
        textX.anchor.set(1, 0.5); 

        viewport.addChild(textX);
      });  

      // Display fromId for the column node
      graph.forEachNode((node: any) => {
        const sourceData = this.nodeMap.get(node);
        if (!sourceData) return;

        const textY = new PIXI.Text(node);
        textY.style = textStyle;
        textY.x = nodeX + (rectWidth / 2) + (gap * sourceData.index);
        textY.y = nodeY - (rectHeight / 2);
        textY.angle = 270;
        textY.anchor.set(0, 0.5);

        viewport.addChild(textY);
      });  
    }  
  },
})
</script>