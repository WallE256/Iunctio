<template>
  <div id="canvas-parent" ref="canvas-parent" style="height: 100%; width: 100%;">
    <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  </div>
  <info-tool id="info-tool" ref="info-tool" v-bind:values="this.infotool_value_list" v-bind:style="'left: ' + this.infotoolXPos + 'px; top: ' + this.infotoolYPos + 'px; display: ' + this.infotoolDisplay + ';'"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import * as PIXI from "pixi.js";
import Graph from "graphology";
import { debounce } from "lodash";
import * as GlobalStorage from "@/scripts/globalstorage";
import InfoTool from "@/components/visualise/InfoTool.vue";
import { Viewport } from 'pixi-viewport';

type Settings = {
  variety: string, // "edge-frequency" or "sentiment"
  hoverEdgeDirection: string, // "incoming" or "outgoing" or "both"
  drawInnerLines: boolean, // true or false
};

export default defineComponent({

  components: { InfoTool, },

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
      console.warn("Non-existent diagram ID:", this.diagramid);
      return;
    }

    const dataset = await GlobalStorage.getDataset(this.diagram.graphID);
    if (!dataset) {
      console.warn("Non-existent dataset:", this.diagram.graphID);
      return;
    }
    this.graph = dataset.graph;

    this.infotool = this.$refs["info-tool"] as HTMLElement;

    this.app = new PIXI.Application({
      view: this.canvas,
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

    this.createMatrix();

    // this has to happen next tick, otherwise the elements do not have their
    // size yet (because they've not been renderd yet)
    this.$nextTick(() => {
      const app = this.app as PIXI.Application;
      app.resize();

      this.diagram.onChange = (diagram, changedKey) => {
        if (changedKey === "selectedNode") {
          // no need to redraw the entire diagram, just highlight some
          this.unhighlight();

          this.selectedNodes = GlobalStorage.selectedNodes
            .filter((node) => node.datasetID === diagram.graphID)
            .map((node) => node.nodeID);
          for (const node of this.selectedNodes) {
            const nodeData = this.nodeMap.get(node);
            if (nodeData) {
              nodeData.rectangle.tint = 0xFFFFFF;
            }
          }
          this.highlight();
          return;
        }

        this.draw(this.graph, app, this.diagram.settings, this.viewport as Viewport);
      };
      this.draw(this.graph, app, this.diagram.settings, this.viewport as Viewport);
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
      infotool: document.createElement('null'),
      infotool_value_list: [] as string[],
      infotoolXPos: 0,
      infotoolYPos: 0,
      infotoolDisplay: "none",
      viewport: null as null | Viewport,
      graph: new Graph({}),

      matrix: [] as PIXI.Graphics[][],

      diagram: null as GlobalStorage.Diagram | null,
      canvas: null as null | HTMLCanvasElement,

      lines: [] as PIXI.Graphics[],

      horizontalHighlight: null as PIXI.Graphics,
      verticalHighlight: null as PIXI.Graphics,

      nodeSize: 17,

      defaultStyle: new PIXI.TextStyle({
        fill: "#000000",
      }),
    };
  },

  methods: {
    handleResize(e: any, graph: Graph, app: PIXI.Application, settings: Settings, viewport: Viewport) {
      this.draw(graph, app, settings, viewport);
    },

    createMatrix() {
      // give each node a corresponding index
      let i = 0;
      this.graph.forEachNode((source: any, sourceAttr) => {
        const sourceString = source.toString();
        const text = new PIXI.Text(sourceString, this.defaultStyle);
        const rectangle = new PIXI.Graphics();

        this.nodeMap.set(source, { index: i, });
        i++;
      });

      // create a matrix that stores graphic objects for each existing edge
      this.matrix.length = this.graph.order;
      for(let i = 0; i < this.graph.order; i++) {
        this.matrix[i] = Array.from({ length: this.graph.order }, () => null)
      }

      this.graph.forEachNode((node_1: any) => {
        let sourceData1 = this.nodeMap.get(node_1);
        this.graph.forEachNode((node_2: any) => {
          let sourceData2 = this.nodeMap.get(node_2);

          if (this.graph.outEdges(node_1, node_2).length < 1) return;

          const rectangle = new PIXI.Graphics();
          this.matrix[sourceData1.index][sourceData2.index] = rectangle;

          rectangle.interactive = true;
          rectangle.buttonMode = true;

          rectangle.on("mouseover", (event) => {
            event.stopPropagation();

            const direction = this.diagram.settings.highlightEdgeDirection;
            const color = 0xD2D2D2;

            if(direction === "incoming" && this.matrix[1][sourceData2.index].tint != 0xB8B6B6 && this.graph.outEdges(node_1, node_2).length < 1) {
              for(let i = 0; i < this.graph.order; i++) {
                this.matrix[i][sourceData2.index].tint = color;
              }
            } else if(direction === "outgoing" && this.matrix[sourceData1.index][1].tint != 0xB8B6B6 && this.graph.outEdges(node_1, node_2).length < 1) {
              for(let i = 0; i < this.graph.order; i++) {
                this.matrix[sourceData1.index][i].tint = color;
              }
            }

            // Reset HTML
            this.infotool_value_list = [];

            if(this.graph.hasEdge(node_1, node_2)) {

              this.infotoolDisplay = "inline";

              // Edge ID
              this.infotool_value_list.push("<h2 style='font-size: 16px;'> Edge: " + node_1 + "->" + node_2 + "</h3>");
              this.infotool_value_list.push("<hr>");

              // Edge Frequency and Sentiment
              this.infotool_value_list.push("<p> Edge Frequency: " + this.graph.outEdges(node_1, node_2).length + "</p>");
              this.infotool_value_list.push("<p> Average Sentiment: " + this.avgSentiment(node_1, node_2) + "</p>");
              this.infotool_value_list.push("<br>");

              // Node 1 Attributes
              this.infotool_value_list.push("<p> From Email: " + this.graph.getNodeAttributes(node_1)["email"] + "</p>");
              this.infotool_value_list.push("<p> From Jobtitle: " + this.graph.getNodeAttributes(node_1)["jobtitle"] + "</p>");

              this.infotool_value_list.push("<br>");

              // Node 2 Attributes
              this.infotool_value_list.push("<p> To Email: " + this.graph.getNodeAttributes(node_2)["email"] + "</p>");
              this.infotool_value_list.push("<p> To Jobtitle: " + this.graph.getNodeAttributes(node_2)["jobtitle"] + "</p>");

              const mouseEvent = event.data.originalEvent as MouseEvent;
              const canvasParent = this.$refs["canvas-parent"] as HTMLElement;
              const rectangle = canvasParent.getBoundingClientRect();

              this.infotoolXPos = Math.min(
                mouseEvent.clientX + 20,
                rectangle.left + canvasParent.clientWidth - 250,
              );
              this.infotoolYPos = Math.min(
                mouseEvent.clientY + 20,
                rectangle.top + canvasParent.clientHeight - 250,
              );
            }

          });

          rectangle.on("mouseout", (event) => {
            event.stopPropagation();

            this.infotoolDisplay = "none";

            const direction = this.diagram.settings.highlightEdgeDirection;
            const color = 0xFFFFFF;

            if(direction === "incoming" && this.matrix[1][sourceData2.index].tint != 0xB8B6B6) {
              for(let i = 0; i < this.graph.order; i++) {
                this.matrix[i][sourceData2.index].tint = color;
              }
            } else if(direction === "outgoing" && this.matrix[sourceData1.index][1].tint != 0xB8B6B6) {
              for(let i = 0; i < this.graph.order; i++) {
                this.matrix[sourceData1.index][i].tint = color;
              }
            }
          });

          //brush-and-linking interactivity
          rectangle.on("click", (event) => {

            if (!this.diagram) return;

            const append = (event.data.originalEvent as MouseEvent).ctrlKey;
            if (this.diagram.settings.highlightEdgeDirection === "outgoing") {
              this.$emit("selected-node-change", this.diagram.graphID, node_1, append);
            } else if (this.diagram.settings.highlightEdgeDirection === "incoming") {
              this.$emit("selected-node-change", this.diagram.graphID, node_2, append);
            }
          });
        });
      });
    },

    drawLines(viewport: Viewport, settings: Settings, startX: number, startY: number) {
      const numberOfLines = 2 * (this.graph.order + 1);
      this.lines.length = numberOfLines;

      for (let index = 0; index < numberOfLines; index++) {

        if ((settings.drawInnerLines) || (index == 0) || (index == numberOfLines / 2 - 1) || (index == numberOfLines / 2) || (index == numberOfLines - 1)) {
          this.lines[index] = new PIXI.Graphics();
          this.lines[index].lineStyle(1, 0x000000);
          this.lines[index].moveTo(0, 0);

          if (index < numberOfLines / 2) { // Horizontal
            this.lines[index].lineTo((this.nodeSize * this.graph.order), 0);
            this.lines[index].x = startX;
            this.lines[index].y = startY + (this.nodeSize * index);
          } else { // Vertical
            this.lines[index].lineTo(0, (this.nodeSize * this.graph.order));
            this.lines[index].x = startX + (this.nodeSize * (index - (this.graph.order + 1)));
            this.lines[index].y = startY;
          }

          viewport.addChild(this.lines[index]);
        }
      }
    },

    draw(graph: Graph, app: PIXI.Application, settings: Settings, viewport: Viewport) {
      const canvas = this.canvas as HTMLCanvasElement;
      const textStyle = new PIXI.TextStyle({
        fill: "#000000",
        fontSize: 12,
      });
      const labelStyle = new PIXI.TextStyle({
        fill: "#000000",
        // fontFamily: "\"Courier New\", Courier, monospace",
        fontSize: 40,
      });
      viewport.removeChildren();

      const nodeX = canvas.width * 1/10;
      const nodeY = canvas.height * 1/5;
      let maxEdges = 0;

      this.drawLines(viewport, settings, nodeX, nodeY);

      // Horizontal Highlight
      this.horizontalHighlight = new PIXI.Graphics();
      this.horizontalHighlight.beginFill(0xFE00EF);
      this.horizontalHighlight.drawRect(nodeX, 0, this.nodeSize * this.graph.order, this.nodeSize);
      this.horizontalHighlight.endFill();
      this.horizontalHighlight.alpha = 0;
      viewport.addChild(this.horizontalHighlight);

      // Vertical Highlight
      this.verticalHighlight = new PIXI.Graphics();
      this.verticalHighlight.beginFill(0xFE00EF);
      this.verticalHighlight.drawRect(0, nodeY, this.nodeSize, this.nodeSize * this.graph.order);
      this.verticalHighlight.endFill();
      this.verticalHighlight.alpha = 0;
      viewport.addChild(this.verticalHighlight);

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

          if (this.graph.outEdges(node_1, node_2).length < 1) return;

          const rectangle = this.matrix[sourceData1.index][sourceData2.index];

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

              // rectangle.alpha = Math.abs(avgSentiment * 0.2 + 0.8);
            }

          } else {
            rectangle.beginFill(0xC0C0C0, 1);
          }
          rectangle.drawRect(0, 0, this.nodeSize, this.nodeSize);
          rectangle.endFill();

          rectangle.interactive = true;
          // rectangle.buttonMode = true;
          rectangle.on("mouseover", (event) => {
            event.stopPropagation();

            if(settings.hoverEdgeDirection === "outgoing" || settings.hoverEdgeDirection === "both") {
              this.horizontalHighlight.y = nodeY + (this.nodeSize * sourceData1.index);
              this.horizontalHighlight.alpha = 0.5;
            }
            if(settings.hoverEdgeDirection === "incoming" || settings.hoverEdgeDirection === "both") {
              this.verticalHighlight.x = nodeX + (this.nodeSize * sourceData2.index);
              this.verticalHighlight.alpha = 0.5;
            }
          });

          rectangle.on("mouseout", (event) => {
            event.stopPropagation();

            this.horizontalHighlight.alpha = 0;
            this.verticalHighlight.alpha = 0;
          });

          rectangle.x = nodeX + (this.nodeSize * sourceData2.index);
          rectangle.y = nodeY + (this.nodeSize * sourceData1.index);

          viewport.addChild(rectangle as PIXI.Graphics);
        });
      });

      // Display fromId for the row node
      graph.forEachNode((node: any) => {
        const sourceData = this.nodeMap.get(node);
        if (!sourceData) return;

        const textX = new PIXI.Text(node);
        textX.style = textStyle;
        textX.x = nodeX - (this.nodeSize / 2);
        textX.y = nodeY + (this.nodeSize / 2) + (this.nodeSize * sourceData.index);
        textX.anchor.set(1, 0.5);

        viewport.addChild(textX);
      });

      // Display fromId for the column node
      graph.forEachNode((node: any) => {
        const sourceData = this.nodeMap.get(node);
        if (!sourceData) return;

        const textY = new PIXI.Text(node);
        textY.style = textStyle;
        textY.x = nodeX + (this.nodeSize / 2) + (this.nodeSize * sourceData.index);
        textY.y = nodeY - (this.nodeSize / 2);
        textY.angle = 270;
        textY.anchor.set(0, 0.5);

        viewport.addChild(textY);
      });

      const fromId = new PIXI.Text("From ID");
      fromId.style = labelStyle;
      fromId.x = nodeX - (this.nodeSize / 2) - 80;
      fromId.y = nodeY + (this.nodeSize / 2) + (this.nodeSize * (graph.order / 2)) + 20;
      fromId.angle = 270;
      viewport.addChild(fromId);

      const toId = new PIXI.Text("To ID");
      toId.style = labelStyle;
      toId.x = nodeX + (this.nodeSize / 2) + (this.nodeSize * (graph.order / 2)) - 35;
      toId.y = nodeY - (this.nodeSize / 2) - 65;
      viewport.addChild(toId);
    },

    maxEdges() {
      const graph = this.graph;
      let maxEdges = 0;

      graph.forEachNode((node_1: any) => {
          graph.forEachNode((node_2: any) => {
            if (maxEdges < graph.outEdges(node_1, node_2).length)
            {
              maxEdges = graph.outEdges(node_1, node_2).length;
            }
          });
        });
      return Math.log(maxEdges);
    },

    avgSentiment(node_1: any, node_2 : any) : number{
      const graph = this.graph;

      let sentimentSum = 0;
      for(let edge of graph.outEdges(node_1, node_2)) {
        sentimentSum += parseFloat(graph.getEdgeAttributes(edge)["sentiment"]);
      }
      return sentimentSum / graph.outEdges(node_1, node_2).length;
    },

    colour(node_1: any, node_2 : any, maxEdges: number, rectangle: PIXI.Graphics) {
      const graph = this.graph;
      const diagram = this.diagram;
      if (!diagram) return;

      if (graph.hasEdge(node_1, node_2)) {

        if (diagram.settings.variety === "edge-frequency") {
          rectangle.beginFill(0xC71585, 1);
          rectangle.alpha = (Math.log(graph.outEdges(node_1, node_2).length) / maxEdges) * 0.8 + 0.2;
        } else if (diagram.settings.variety === "sentiment") {

          let avgSentiment = this.avgSentiment(node_1, node_2);

          if (avgSentiment > 0) {
            rectangle.beginFill(0xADE288, 1);
          } else if (avgSentiment < 0) {
            rectangle.beginFill(0xF9665E, 1);
          } else if (avgSentiment == 0) {
            rectangle.beginFill(0xFEF4BE, 1);
          }

          // Not really needed
          // rectangle.alpha = Math.abs(avgSentiment * 100 + 0.2);

          rectangle.alpha = 1;
        }

      } else if (diagram.settings.variety === "edge-frequency") {
        rectangle.beginFill(0xFFFFFF, 1);
      } else if (diagram.settings.variety === "sentiment") {
        rectangle.beginFill(0xFFFFFF, 1);
      }
    },

    highlight() {
      const diagram = this.diagram;
      if (!diagram) return;

      const color = 0xB8B6B6;

      const highlightNode = (node: string) => {
        const nodeData = this.nodeMap.get(node);
        if (!nodeData) return;
        const nodeIndex = nodeData.index;

        if (diagram.settings.highlightEdgeDirection === "incoming" || diagram.settings.highlightEdgeDirection === "both") {
          for(let i = 0; i < this.graph.order; i++) {
            this.matrix[i][nodeIndex].tint = color;
          }
        } else if (diagram.settings.highlightEdgeDirection === "outgoing" || diagram.settings.highlightEdgeDirection === "both") {
          for(let i = 0; i < this.graph.order; i++) {
            this.matrix[nodeIndex][i].tint = color;
          }
        }
      };

      for (const node of this.selectedNodes) {
        highlightNode(node);
      }
    },

    unhighlight() {
      const diagram = this.diagram;
      if (!diagram) return;

      const graph = this.graph;
      const color = 0xFFFFFF;

      const unhighlightNode = (node: string) => {
        const nodeData = this.nodeMap.get(node);
        if (!nodeData) return;
        const nodeIndex = nodeData.index;
        for(let i = 0; i < graph.order; i++) {
          this.matrix[nodeIndex][i].tint = color;
          this.matrix[i][nodeIndex].tint = color;
        }
      };

      for (const node of this.selectedNodes) {
        unhighlightNode(node);
      }
    }
  },
})
</script>
