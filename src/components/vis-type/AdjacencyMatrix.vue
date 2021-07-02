<template>
  <div ref="diagram" style="height: 100%; width: 100%;">
    <color-legend :color-scheme="colorMap"></color-legend>
    <div id="canvas-parent" ref="canvas-parent" style="height: 100%; width: 100%;">
      <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
    </div>
    <info-tool id="info-tool" ref="info-tool" v-bind:values="this.infotool_value_list" v-bind:style="'left: ' + this.infotoolXPos + 'px; top: ' + this.infotoolYPos + 'px; display: ' + this.infotoolDisplay + ';'"/>
    <div v-if="showTimeline" style="height: 17%; width: 100%;">
      <statistical-diagram class="timeline" :diagramid="timelineDiagram.id" />
    </div>
    <div
      v-show="showTimeline"
      id="time-slider"
      ref="time-slider"
      style="max-height: 3%; width: 80%; margin: 0 10%;"
    ></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import * as PIXI from "pixi.js";
import Graph from "graphology";
import { debounce } from "lodash";
import noUiSlider from "nouislider";
import * as GlobalStorage from "@/scripts/globalstorage";
import { getDefaultSettings } from "@/scripts/settingconfig";
import { dateIsBetween, findMinMaxDates, getMonthsDifference } from "@/scripts/util";
import InfoTool from "@/components/visualise/InfoTool.vue";
import StatisticalDiagram from "@/components/vis-type/StatisticalDiagram.vue";
import { Viewport } from 'pixi-viewport';
import ColorLegend from "@/components/visualise/ColorLegend.vue";

type Settings = {
  data: string, // "edge-frequency" or "sentiment" or "email-type"
  edgeHighlightDirection: string, // "incoming" or "outgoing" or "both"
  drawInnerLines: boolean, // true or false
  showTimeline: boolean,
  timeRange: [string, string],
};

export default defineComponent({

  components: { InfoTool, ColorLegend, StatisticalDiagram},

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
    const diagramDiv = this.$refs["diagram"] as HTMLElement;

    diagramDiv.addEventListener(
      "resize",
      debounce((event) => {

        if (!this.diagram) {
          return;
        }

        // Send resize event to timeline
        const timeline = document.getElementsByClassName("timeline");
        Array.from(timeline).forEach(element => {
          element.dispatchEvent(event);
        });

        canvas.height = canvasParent.offsetHeight;
        canvas.width = canvasParent.offsetWidth;

        this.handleResize(event, this.graph, this.app as PIXI.Application, this.diagram.settings as Settings, this.viewport as Viewport);

        const application = this.app as PIXI.Application;
        application.resize();
      }, 250)
    )

    const diagram = await GlobalStorage.getDiagram(this.diagramid);
    if (!diagram) {
      console.warn("Non-existent diagram ID:", this.diagramid);
      return;
    }
    this.diagram = diagram;

    this.dataset = await GlobalStorage.getDataset(this.diagram.graphID);
    if (!this.dataset) {
      console.warn("Non-existent dataset:", this.diagram.graphID);
      return;
    }
    this.graph = this.dataset.graph;

    this.infotool = this.$refs["info-tool"] as HTMLElement;

    this.app = new PIXI.Application({
      view: this.canvas,
      antialias: true,
      backgroundAlpha: 0,
      resizeTo: canvasParent,
    });

    this.viewport = new Viewport({
      screenWidth: canvas.width,
      screenHeight: canvas.height,
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

    this.viewport.moveCenter(window.innerWidth / 2, window.innerHeight / 2);
    this.viewport.setZoom(0.3);

    this.createMatrix();

    // initialize time slider
    [this.minDate, this.maxDate] = findMinMaxDates(this.dataset);
    const maxValue = getMonthsDifference(this.minDate, this.maxDate);

    const slider = this.$refs["time-slider"] as any;
    if (!slider.noUiSlider) {
      noUiSlider.create(slider, {
        connect: true,
        range: {
          min: 0,
          max: maxValue,
        },
        margin: 0,
        start: [0, maxValue],
        step: 1,
      });
      slider.noUiSlider.on("set", (values: any) => {
        this.onTimelineChange(parseInt(values[0]), parseInt(values[1]), maxValue);
      });
    }
    this.toggleTimeline(diagram.settings.showTimeline);

    // this has to happen next tick, otherwise the elements do not have their
    // size yet (because they've not been renderd yet)
    this.$nextTick(() => {
      const app = this.app as PIXI.Application;
      app.resize();

      diagram.addOnChange((diagram: GlobalStorage.Diagram, changedKey: string) => {
        if (changedKey === "showTimeline") {
          this.toggleTimeline(diagram.settings.showTimeline);
          return;
        }
        if (changedKey === "selectedNode") {
          // no need to redraw the entire diagram, just highlight some
          this.unhighlight();

          this.selectedNodes = GlobalStorage.selectedNodes
            .filter((node) => node.datasetID === diagram.graphID)
            .map((node) => node.nodeID);

          this.highlight();
          return;
        }

        this.draw(this.graph, app, diagram.settings, this.viewport as Viewport);
        this.unhighlight();
        this.highlight();
      });

      this.draw(this.graph, app, diagram.settings, this.viewport as Viewport);
      this.highlight();
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
      nodeMap: new Map<string, number>(),

      // the node that you're currently hovering over
      selectedNodes: [] as string[],

      app: null as null | PIXI.Application,
      infotool: document.createElement('null'),
      infotool_value_list: [] as string[],
      infotoolXPos: 0,
      infotoolYPos: 0,
      infotoolDisplay: "none",
      viewport: null as null | Viewport,

      graph: new Graph({}),
      dataset: null as GlobalStorage.Dataset | null,

      matrix: [] as PIXI.Graphics[][],

      diagram: null as null | GlobalStorage.Diagram,
      canvas: null as null | HTMLCanvasElement,

      lines: [] as PIXI.Graphics[],

      horizontalHighlight: null as null | PIXI.Graphics,
      verticalHighlight: null as null | PIXI.Graphics,

      brushAndLinkingHighlights: [] as PIXI.Graphics[],

      nodeSize: 34,

      minXPos: 0,
      minYPos: 0,

      colorMap: new Map<string, {
        title: string,
        id: number,
        assignedColor: string,
      }>(),

      defaultStyle: new PIXI.TextStyle({
        fill: "#000000",
      }),

      minDate: new Date("1000-01-01"),
      maxDate: new Date("2999-12-31"),
      showTimeline: false,
      timelineDiagram: null as GlobalStorage.Diagram | null,
    };
  },

  methods: {
    handleResize(e: any, graph: Graph, app: PIXI.Application, settings: Settings, viewport: Viewport) {
      if (this.canvas) {
        viewport.screenWidth = this.canvas.width;
        viewport.screenHeight = this.canvas.height;
      }
      this.draw(graph, app, settings, viewport);
      this.unhighlight();
      this.highlight();
    },

    createMatrix() {
      if (!this.dataset) {
        console.warn("Missing dataset");
        return;
      }

      // give each node a corresponding index
      let i = 0;
      const sortedNodes = this.dataset.getClusteredNodes();
      for (const node of sortedNodes) {
        this.nodeMap.set(node, i);
        i++;
      }

      // create a matrix that stores graphic objects for each existing edge
      this.matrix.length = this.graph.order;

      this.graph.forEachNode((node_1: any) => {
        const sourceIndex = this.nodeMap.get(node_1);
        if (!sourceIndex) return;

        this.matrix[sourceIndex] = [];
        this.matrix[sourceIndex].length = this.graph.order;

        this.graph.forEachNode((node_2: any) => {
          const targetIndex = this.nodeMap.get(node_2);
          if (!targetIndex) return;

          if (!this.graph.hasEdge(node_1, node_2)) return;

          const rectangle = new PIXI.Graphics();

          rectangle.interactive = true;
          rectangle.buttonMode = true;

          rectangle.on("mouseover", (event) => {
            event.stopPropagation();

            // Reset HTML
            this.infotool_value_list = [];

            this.infotoolDisplay = "inline";

            // Edge ID
            this.infotool_value_list.push("<h2 style='font-size: 16px;'> Edge: " + node_1 + " -> " + node_2 + "</h2><hr><br>");

            // Edge Frequency and Sentiment
            let avgSentiment = "0";
            if (this.avgSentiment(node_1, node_2) != 0) {
              avgSentiment = this.avgSentiment(node_1, node_2).toFixed(6);
            }
            this.infotool_value_list.push("<p> Edge Frequency: " + this.graph.outEdges(node_1, node_2).length + "</p><p> Average Sentiment: " + avgSentiment + "</p><p> Most Frequent Email Type: " + this.messageType(node_1, node_2) + "</p><br>");

            // Node 1 Attributes
            this.infotool_value_list.push("<h3> From: </h3>");
            for (const [key, attribute] of Object.entries(this.graph.getNodeAttributes(node_1))) {
              if (key === "community") {
                this.infotool_value_list.push("<p> Clustering Community: " + attribute + "</p>");
              } else {
                this.infotool_value_list.push("<p>" + key + ": " + attribute + "</p>");
              }
            }

            // Node 2 Attributes
            this.infotool_value_list.push("<br><h3> To: </h3>");
            for (const [key, attribute] of Object.entries(this.graph.getNodeAttributes(node_2))) {
              if (key === "community") {
                this.infotool_value_list.push("<p> Clustering Community: " + attribute + "</p>");
              } else {
                this.infotool_value_list.push("<p>" + key + ": " + attribute + "</p>");
              }
            }

            if (this.diagram && this.diagram.settings.edgeHighlightDirection === "both" && sourceIndex !== targetIndex) this.infotool_value_list.push("<br><hr><p style='font-style: italic'> Hover over edges with the </p><p style='font-style: italic'> same incoming and outgoing </p><p style='font-style: italic'> nodes for brushing-and-linking </p><p style='font-style: italic'> Or change highlight direction.</p>");
            else this.infotool_value_list.push("<br><hr><p style='font-style: italic'> Click for brush-and-link selection </p><p style='font-style: italic'> Ctrl+Click for multiple nodes </p>");

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

          });

          rectangle.on("mouseout", (event) => {
            event.stopPropagation();

            this.infotoolDisplay = "none";
          });

          //brush-and-linking interactivity
          rectangle.on("click", (event) => {

            if (!this.diagram) return;

            const append = (event.data.originalEvent as MouseEvent).ctrlKey;
            if (this.diagram.settings.edgeHighlightDirection === "both" && node_1 === node_2) {
              this.$emit("selected-node-change", this.diagram.graphID, node_1, append);
            } else if (this.diagram.settings.edgeHighlightDirection === "outgoing") {
              this.$emit("selected-node-change", this.diagram.graphID, node_1, append);
            } else if (this.diagram.settings.edgeHighlightDirection === "incoming") {
              this.$emit("selected-node-change", this.diagram.graphID, node_2, append);
            }
          });

          this.matrix[sourceIndex][targetIndex] = rectangle;
        });
      });
    },

    drawLines(viewport: Viewport) {
      const numberOfLines = 2 * this.graph.order;

      this.lines = [];
      this.lines.length = numberOfLines;

      for (let index = 0; index < numberOfLines; index++) {

        if (((this.diagram) && (this.diagram.settings.drawInnerLines)) || (index == 0) || (index == numberOfLines / 2 - 1) || (index == numberOfLines / 2) || (index == numberOfLines - 1)) {
          this.lines[index] = new PIXI.Graphics();
          this.lines[index].lineStyle(1, 0x000000);
          this.lines[index].moveTo(0, 0);

          if (index < numberOfLines / 2) { // Horizontal
            this.lines[index].lineTo((this.nodeSize * (this.graph.order - 1)), 0);
            this.lines[index].x = this.minXPos + this.nodeSize;
            this.lines[index].y = this.minYPos + (this.nodeSize * (index + 1));
          } else { // Vertical
            this.lines[index].lineTo(0, (this.nodeSize * (this.graph.order - 1)));
            this.lines[index].x = this.minXPos + (this.nodeSize * (index - this.graph.order + 1));
            this.lines[index].y = this.minYPos + this.nodeSize;
          }

          viewport.addChild(this.lines[index] as PIXI.Graphics);
        }
      }
    },

    draw(graph: Graph, app: PIXI.Application, settings: Settings, viewport: Viewport) {
      const canvas = this.canvas as HTMLCanvasElement;
      const textStyle = new PIXI.TextStyle({
        fill: "#000000",
        fontSize: 20,
      });
      const labelStyle = new PIXI.TextStyle({
        fill: "#000000",
        fontSize: 100,
      });
      viewport.removeChildren();

      this.minXPos = viewport.center.x - viewport.worldScreenWidth / 2.25;
      this.minYPos = viewport.center.y - viewport.worldScreenHeight / 2.5;
      let maxEdges = this.maxEdges();

      this.drawLines(viewport);

      graph.forEachNode((node_1: any) => {
        const sourceIndex = this.nodeMap.get(node_1);
        if (!sourceIndex) return;

        graph.forEachNode((node_2: any) => {
          const targetIndex = this.nodeMap.get(node_2);
          if (!targetIndex || !this.graph.hasEdge(node_1, node_2)) return;

          const rectangle = this.matrix[sourceIndex][targetIndex];
          rectangle.clear();

          this.colour(node_1, node_2, maxEdges, rectangle as PIXI.Graphics);

          rectangle.drawRect(0, 0, this.nodeSize, this.nodeSize);
          rectangle.endFill();

          rectangle.x = this.minXPos + (this.nodeSize * targetIndex);
          rectangle.y = this.minYPos + (this.nodeSize * sourceIndex);

          rectangle.on("mouseover", (event) => {
            event.stopPropagation();

            if (!this.horizontalHighlight || !this.verticalHighlight) return;

            if (settings.edgeHighlightDirection === "outgoing" || settings.edgeHighlightDirection === "both") {
              this.horizontalHighlight.y = this.minYPos + (this.nodeSize * sourceIndex);
              this.horizontalHighlight.alpha = 0.5;
            }
            if (settings.edgeHighlightDirection === "incoming" || settings.edgeHighlightDirection === "both") {
              this.verticalHighlight.x = this.minXPos + (this.nodeSize * targetIndex);
              this.verticalHighlight.alpha = 0.5;
            }
            if (settings.edgeHighlightDirection === "both" && sourceIndex !== targetIndex) {
              this.horizontalHighlight.tint = 0xD9D9D9;
              this.verticalHighlight.tint = 0xD9D9D9;
            } else {
              this.horizontalHighlight.tint = 0xFE00EF;
              this.verticalHighlight.tint = 0xFE00EF;
            }
          });

          rectangle.on("mouseout", (event) => {
            event.stopPropagation();

            if (!this.horizontalHighlight || !this.verticalHighlight) return;

            this.horizontalHighlight.alpha = 0;
            this.verticalHighlight.alpha = 0;
          });

          viewport.addChild(rectangle as PIXI.Graphics);
        });
      });

      // Horizontal Highlight
      this.horizontalHighlight = new PIXI.Graphics();
      this.horizontalHighlight.beginFill(0xFFFFFF);
      this.horizontalHighlight.drawRect(this.minXPos + this.nodeSize, 0, this.nodeSize * (this.graph.order - 1), this.nodeSize);
      this.horizontalHighlight.endFill();
      this.horizontalHighlight.alpha = 0;
      viewport.addChild(this.horizontalHighlight as PIXI.Graphics);

      // Vertical Highlight
      this.verticalHighlight = new PIXI.Graphics();
      this.verticalHighlight.beginFill(0xFFFFFF);
      this.verticalHighlight.drawRect(0, this.minYPos + this.nodeSize, this.nodeSize, this.nodeSize * (this.graph.order - 1));
      this.verticalHighlight.endFill();
      this.verticalHighlight.alpha = 0;
      viewport.addChild(this.verticalHighlight as PIXI.Graphics);

      let textMaxWidth = 0;

      // Display fromId for the row node
      graph.forEachNode((node: any, attributes: any) => {
        const nodeIndex = this.nodeMap.get(node);
        if (!nodeIndex) return;

        const textX = new PIXI.Text(attributes.email.substring(0, attributes.email.indexOf("@")));
        textX.style = textStyle;
        textX.x = this.minXPos + (this.nodeSize / 2);
        textX.y = this.minYPos + (this.nodeSize / 2) + (this.nodeSize * nodeIndex);
        textX.anchor.set(1, 0.5);

        if (textX.width > textMaxWidth) textMaxWidth = textX.width;

        viewport.addChild(textX);
      });

      // Display toId for the column node
      graph.forEachNode((node: any, attributes: any) => {
        const nodeIndex = this.nodeMap.get(node);
        if (!nodeIndex) return;

        const textY = new PIXI.Text(attributes.email.substring(0, attributes.email.indexOf("@")));
        textY.style = textStyle;
        textY.x = this.minXPos + (this.nodeSize / 2) + (this.nodeSize * nodeIndex);
        textY.y = this.minYPos + (this.nodeSize / 2);
        textY.angle = 270;
        textY.anchor.set(0, 0.5);

        viewport.addChild(textY);
      });

      const fromId = new PIXI.Text("From");
      fromId.style = labelStyle;
      fromId.anchor.set(0.5, 1);
      fromId.x = this.minXPos - (this.nodeSize / 2) - textMaxWidth;
      fromId.y = this.minYPos + (this.nodeSize / 2) + (this.nodeSize * (graph.order / 2)) + 20;
      fromId.angle = 270;
      viewport.addChild(fromId);

      const toId = new PIXI.Text("To");
      toId.style = labelStyle;
      toId.anchor.set(0.5, 1);
      toId.x = this.minXPos + (this.nodeSize / 2) + (this.nodeSize * (graph.order / 2)) - 35;
      toId.y = this.minYPos - (this.nodeSize / 2) - textMaxWidth;
      viewport.addChild(toId);
    },

    maxEdges() {
      const graph = this.graph;
      let maxEdges = 0;

      graph.forEachNode((node_1: any) => {
          graph.forEachNode((node_2: any) => {
            const newLength = graph.outEdges(node_1, node_2).length;
            if (maxEdges < newLength) {
              maxEdges = newLength;
            }
          });
        });
      return Math.log(maxEdges);
    },

    countEdges(node1: any, node2: any): number {
      if (!this.diagram) return 0;
      const timeRange = (this.diagram.settings as Settings).timeRange;

      let length = 0;

      if (node1 === node2) {
        this.graph.forEachEdge(node1, node2, (edge, edgeAttributes) => {
          const date = edgeAttributes.date;
          if (!date || dateIsBetween(date, timeRange)) {
            length++;
          }
        });
      } else {
        this.graph.forEachOutEdge(node1, node2, (edge, edgeAttributes) => {
          const date = edgeAttributes.date;
          if (!date || dateIsBetween(date, timeRange)) {
            length++;
          }
        });
      }

      return length;
    },

    avgSentiment(node_1: any, node_2 : any): number {
      if (!this.diagram) return 0;
      const timeRange = (this.diagram.settings as Settings).timeRange;

      let sentimentSum = 0;
      let length = 0;
      this.graph.forEachOutboundEdge(node_1, node_2, (edge, edgeAttributes) => {
        const date = edgeAttributes.date;
        if (!date || dateIsBetween(date, timeRange)) {
          sentimentSum += parseFloat(edgeAttributes.sentiment);
          length++;
        }
      });
      return length == 0 ? 0 : sentimentSum / length;
    },

    messageType(node_1: any, node_2 : any) {
      const graph = this.graph;
      let to = 0;
      let cc = 0;

      for (let edge of graph.outEdges(node_1, node_2)) {
        if (graph.getEdgeAttributes(edge)["messageType"] == "TO") {
          to++;
        } else if (graph.getEdgeAttributes(edge)["messageType"] == "CC") {
          cc++;
        }
      }

      if (to > cc) {
        return "TO";
      } else if (to < cc) {
        return "CC";
      } else if (to == cc) {
        return "TO & CC";
      }
    },

    colour(node_1: any, node_2 : any, maxEdges: number, rectangle: PIXI.Graphics) {
      const graph = this.graph;
      const diagram = this.diagram;
      if (!diagram) return;

      if (graph.hasEdge(node_1, node_2)) {

        if (diagram.settings.data === "edge-frequency") {

          const EDGE = 'af1a1a';

          this.colorMap = new Map<string, {
            title: string,
            id: number,
            assignedColor: string,
          }>();
          this.colorMap.set('-1', {title: 'Edge', id: -1, assignedColor: '#'+EDGE});

          rectangle.beginFill(parseInt(EDGE, 16), 1);
          rectangle.alpha = (Math.log(this.countEdges(node_1, node_2)) / maxEdges) * 0.8 + 0.2;

        } else if (diagram.settings.data === "sentiment") {

          const POSITIVE = '66d37e';
          const NEUTRAL = '28c7fa';
          const NEGATIVE = 'ff304f';

          this.colorMap = new Map<string, {
            title: string,
            id: number,
            assignedColor: string,
          }>();
          this.colorMap.set('1', {title: 'Positive', id: 1, assignedColor: '#'+POSITIVE});
          this.colorMap.set('0', {title: 'Neutral', id: 0, assignedColor: '#'+NEUTRAL});
          this.colorMap.set('-1', {title: 'Negative', id: -1, assignedColor: '#'+NEGATIVE});

          let avgSentiment = this.avgSentiment(node_1, node_2);

          if (avgSentiment > 0) {
            rectangle.beginFill(parseInt(POSITIVE, 16), 1);
          } else if (avgSentiment < 0) {
            rectangle.beginFill(parseInt(NEGATIVE, 16), 1);
          } else if (avgSentiment == 0) {
            rectangle.beginFill(parseInt(NEUTRAL, 16), 1);
          }

          rectangle.alpha = 1;

        } else if (diagram.settings.data === "email-type") {

          const TO = 'facf5a';
          const CC = 'ff304f';
          const TOnCC = '28c7fa';

          this.colorMap = new Map<string, {
            title: string,
            id: number,
            assignedColor: string,
          }>();
          this.colorMap.set('1', {title: 'TO', id: 1, assignedColor: '#'+TO});
          this.colorMap.set('0', {title: 'CC', id: 0, assignedColor: '#'+CC});
          this.colorMap.set('-1', {title: 'TO and CC', id: -1, assignedColor: '#'+TOnCC});



          let messageType = this.messageType(node_1, node_2);
          if (messageType === "TO") {
            rectangle.beginFill(parseInt(TO, 16), 1);
          } else if (messageType === "CC") {
            rectangle.beginFill(parseInt(CC, 16), 1);
          } else if (messageType === "TO & CC") {
            rectangle.beginFill(parseInt(TOnCC, 16), 1);
          }

          rectangle.alpha = 1;
        }
      }
    },

    highlight() {
      const diagram = this.diagram;
      if (!diagram) return;

      const color = 0xFE00EF;

      const highlightNode = (node: string) => {
        const nodeIndex = this.nodeMap.get(node);

        if (!nodeIndex) return;

        if ((diagram.settings.edgeHighlightDirection === "incoming") || (diagram.settings.edgeHighlightDirection === "both")) {

          const verticalHighlightBL = new PIXI.Graphics();
          verticalHighlightBL.beginFill(color);
          verticalHighlightBL.drawRect(0, this.minYPos + this.nodeSize, this.nodeSize, this.nodeSize * (this.graph.order - 1));
          verticalHighlightBL.endFill();
          verticalHighlightBL.x = this.minXPos + nodeIndex * this.nodeSize;
          verticalHighlightBL.alpha = 0.5;

          (this.viewport as Viewport).addChild(verticalHighlightBL as PIXI.Graphics);
          this.brushAndLinkingHighlights.push(verticalHighlightBL);

        }
        if ((diagram.settings.edgeHighlightDirection === "outgoing") || (diagram.settings.edgeHighlightDirection === "both")) {

          const horizontalHighlightBL = new PIXI.Graphics();
          horizontalHighlightBL.beginFill(color);
          horizontalHighlightBL.drawRect(this.minXPos + this.nodeSize, 0, this.nodeSize * (this.graph.order - 1), this.nodeSize);
          horizontalHighlightBL.endFill();
          horizontalHighlightBL.y = this.minYPos + nodeIndex * this.nodeSize;
          horizontalHighlightBL.alpha = 0.5;

          (this.viewport as Viewport).addChild(horizontalHighlightBL as PIXI.Graphics);
          this.brushAndLinkingHighlights.push(horizontalHighlightBL);
        }
      };

      for (const node of this.selectedNodes) {
        highlightNode(node);
      }
    },

    unhighlight() {
      const diagram = this.diagram;
      if (!diagram) return;

      const color = 0xFFFFFF;

      const unhighlightNode = (node: string) => {

        this.brushAndLinkingHighlights.forEach(blHighlight => {
          blHighlight.clear();
        });
        this.brushAndLinkingHighlights = [];

      };

      for (const node of this.selectedNodes) {
        unhighlightNode(node);
      }
    },

    onTimelineChange(startValue: number, endValue: number, max: number) {
      const startDate = new Date(
        this.minDate.getTime()
        + startValue / max * (this.maxDate.getTime() - this.minDate.getTime()),
      );
      const start = startDate.toISOString().split("T")[0];
      const endDate = new Date(
        this.minDate.getTime()
        + endValue / max * (this.maxDate.getTime() - this.minDate.getTime()),
      );
      const end = endDate.toISOString().split("T")[0];

      GlobalStorage.changeSetting(this.diagram as GlobalStorage.Diagram, "timeRange", [start, end]);
    },

    toggleTimeline(on: boolean) {
      const canvasParent = this.$refs["canvas-parent"] as HTMLElement;
      if (!this.diagram) return;

      if (on) {
        canvasParent.style.height = "80%";
        const randomID = "timeline-" + String(Math.floor(Math.random() * 1e5));
        const defaultSettings = getDefaultSettings("StatisticalDiagram");
        this.timelineDiagram = new GlobalStorage.Diagram(
          randomID,
          this.diagram.graphID,
          "StatisticalDiagram",
          defaultSettings,
        );
        // this is a little bit hacky, but it's necessary to add it to
        // globalstorage with the current situation
        this.timelineDiagram.invisible = true;
        GlobalStorage.addDiagram(this.timelineDiagram);
      } else {
        if (this.timelineDiagram) {
          GlobalStorage.removeDiagram(this.timelineDiagram);
          this.timelineDiagram = null;
        }
        canvasParent.style.height = "100%";
      }

      this.showTimeline = on;
    },
  },
})
</script>
