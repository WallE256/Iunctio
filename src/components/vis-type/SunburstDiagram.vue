<template>
  <div ref="diagram" style="height: 100%; width: 100%;">
    <color-legend :colorScheme="colorMap"/>
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
import { defineComponent } from "vue";
import StatisticalDiagram from "@/components/vis-type/StatisticalDiagram.vue";
import Graph from "graphology";
import { debounce } from "lodash";
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import * as GlobalStorage from "@/scripts/globalstorage";
import { getDefaultSettings } from "@/scripts/settingconfig";
import noUiSlider from "nouislider";
import InfoTool from "@/components/visualise/InfoTool.vue";
import ColorLegend from "@/components/visualise/ColorLegend.vue";
import { containsEdgeInRange, findMinMaxDates } from "@/scripts/util";

// from https://pixijs.download/dev/docs/packages_graphics-extras_src_drawTorus.ts.html
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

// see also scripts/settingconfig.ts
type Settings = {
  root: string | null,
  height: number,
  variety: string,
  edgeType: string,
  colourType: string,
  diagramColour: number,
  minRenderSize: number,
  showTimeline: boolean,
  timeRange: [string, string],
};

export default defineComponent({
  components: {
    InfoTool,
    ColorLegend,
    StatisticalDiagram,
  },

  props: {
    diagramid: {
      type: String,
      required: true,
    },
    visible: {
      type: Boolean,
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

        this.handleResize(event, this.graph, this.app as PIXI.Application, this.diagram.settings as Settings);

        const application = this.app as PIXI.Application;
        application.resize();
      }, 250)
    )

    const diagram = await GlobalStorage.getDiagram(this.diagramid);
    if (!diagram) {
      console.warn("Non-existent diagram:", this.diagramid);
      return;
    }
    this.diagram = diagram;
    this.dataset = await GlobalStorage.getDataset(diagram.graphID);
    if (!this.dataset) {
      console.warn("Non-existent dataset:", diagram.graphID);
      return;
    }
    this.graph = this.dataset.graph;

    // initialize the time slider
    [this.minDate, this.maxDate] = findMinMaxDates(this.dataset);

    const maxValue = (this.maxDate.getFullYear() - this.minDate.getFullYear()) * 12
        - this.minDate.getMonth() + this.maxDate.getMonth();

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

    this.infotool = this.$refs["info-tool"] as HTMLElement;

    this.app = new PIXI.Application({
      view: this.canvas,
      antialias: true,
      backgroundAlpha: 0,
      resizeTo: canvasParent,
    });

    // limit FPS to improve performance
    this.app.ticker.minFPS = 1;
    this.app.ticker.maxFPS = 5;

    // Create map for number of connections between nodes
    [this.bothConnections, this.outConnections] = this.mapConnections(this.graph);

    const app = this.app as PIXI.Application;

    // this has to happen next tick because otherwise the element sizes are not
    // correct yet (because they've not been rendered yet)
    this.$nextTick(() => {
      app.resize();
      diagram.addOnChange((diagram: GlobalStorage.Diagram, changedKey: string) => {

        if (changedKey === "selectedNode") {
          // un-highlight old nodes
          this.unhighlight();

          this.selectedNodes = GlobalStorage.selectedNodes
            .filter((node) => node.datasetID === diagram.graphID)
            .map((node) => node.nodeID);

          // highlight new nodes
          this.highlight();

          return;
        }

        if (changedKey === "showTimeline") {
          this.toggleTimeline(diagram.settings.showTimeline);
          return;
        }

        this.draw(app, diagram.settings);
        this.createLegendMap();
        this.unhighlight();
        this.highlight();
      });
    });

    this.draw(app, this.diagram.settings);

    this.selectedNodes = GlobalStorage.selectedNodes
      .filter((node) => node.datasetID === diagram.graphID)
      .map((node) => node.nodeID);

    this.highlight();
  },

  created(){
    window.addEventListener(
      "resize",
      debounce((event) => {
        if (!this.diagram || !this.graph) {
          return;
        }
        this.handleResize(event, this.graph, this.app as PIXI.Application, this.diagram.settings as Settings);
      }, 250)
    )
  },

  data() {
    return {
      // the node that you're currently hovering over
      hoverNode: null as string | null,

      graph: new Graph({}),
      dataset: null as GlobalStorage.Dataset | null,
      diagram: null as GlobalStorage.Diagram | null,

      app: null as null | PIXI.Application,
      canvas: null as null | HTMLCanvasElement,
      centerX: 0,
      centerY: 0,
      levelHeight: 0,
      maxWidth: 0,
      maxHeight: 0,
      bothConnections: new Map(),
      outConnections: new Map(),
      attributesColourMap: new Map(),
      colours: null as any,
      selectedNodes: [] as string[],
      graphicsMap: new Map<string, PIXI.Graphics[]>(),
      infotool: document.createElement('null'),
      infotool_value_list: [] as string[],
      infotoolXPos: 0,
      infotoolYPos: 0,
      infotoolDisplay: "none",
      colorMap: new Map<string, {
        title: string,
        id: number,
        assignedColor: string,
      }>(),

      showTimeline: false,
      timelineDiagram: null as GlobalStorage.Diagram | null,
      minDate: new Date("1000-01-01"),
      maxDate: new Date("2999-12-31"),
    };
  },

  unmounted() {
    (this.app as PIXI.Application).destroy(false, true);
    this.graphicsMap.clear();
  },

  methods: {
    handleResize(e: Event, graph: Graph, app: PIXI.Application, settings: Settings) {
      this.draw(app, settings);
      this.highlight();
    },

    unhighlight() {
      const clearTint = 0xffffff;
      for (const node of this.selectedNodes) {
        const graphicsList = this.graphicsMap.get(node) || [];
        for (const graphics of graphicsList) {
          graphics.tint = clearTint;
        }
      }
    },

    highlight() {
      const highlightTint = 0x00D737;
      for (const node of this.selectedNodes) {
        const graphicsList = this.graphicsMap.get(node) || [];
        for (const graphics of graphicsList) {
          graphics.tint = highlightTint;
        }
      }
    },

    // Create map of connections between nodes
    mapConnections(graph: Graph) {
      const map_both = new Map();
      const map_out = new Map();

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
    draw(
      app: PIXI.Application,
      settings: Settings,
    ) {
      app.stage.removeChildren();
      this.graphicsMap = new Map<string, PIXI.Graphics[]>();

      const canvas = this.canvas as HTMLCanvasElement;

      this.centerX = canvas.width / 2;
      this.centerY = canvas.height / 2;

      const predecessors = [] as any[];

      if (settings.root === "[no root]") {
        settings.root = null;
      }

      var nodesWithDegree = 0;

      // Calculate number of nodes with degree
      this.graph.forEachNode((node, attributes) => {
        if (settings.edgeType == 'incoming') {
          if (this.graph.inDegree(node) > 0) {
            nodesWithDegree += 1;
          }
        } else if (settings.edgeType == 'outgoing') {
          if (this.graph.outDegree(node) > 0) {
            nodesWithDegree += 1;
          }
        } else {
          if (this.graph.degree(node) > 0) {
            nodesWithDegree += 1;
          }
        }
      });

      // Create colour pattern
      if (settings.colourType === "rainbow") this.colours = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, nodesWithDegree + 1));
      else {

        let indexNumber = 0;
        this.attributesColourMap = new Map();

        this.graph.forEachNode((node, attributes) => {
          if (attributes[settings.colourType] || attributes[settings.colourType] == 0) {

            this.attributesColourMap.set(attributes[settings.colourType], indexNumber);
            indexNumber += 1;
          }
        });

        this.colours = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, this.attributesColourMap.size + 1));
      }

      var convertedColour;

      const colourType = settings.colourType;

      if ((settings.root) && (colourType !== "rainbow")) convertedColour = this.getColour(settings, this.attributesColourMap.get(this.graph.getNodeAttributes(settings.root).colourType));
      else convertedColour = settings.diagramColour;

      // Calculate height based on graph type
      const root = settings.root === "[no root]" ? null : settings.root;
      if (settings.variety === "sunburst") {
        this.maxWidth = Math.min(canvas.width, canvas.height) * .7;
        this.maxHeight = this.maxWidth;
        this.levelHeight = this.maxHeight / (1.75 * settings.height);

        this.drawDiagram(this.graph, app, settings, root, predecessors, 0, 0, 1, convertedColour);
      } else {
        var borderSize = Math.min(canvas.width, canvas.height) * .2;
        this.maxWidth = canvas.width - borderSize;
        this.maxHeight = canvas.height - borderSize;
        this.levelHeight = this.maxHeight / settings.height;

        this.drawDiagram(this.graph, app, settings, root, predecessors, 0, 0, 1, convertedColour);
      }
    },

  // Draw the subtree of given diagram
  drawDiagram(
    graph: Graph,
    app: PIXI.Application,
    settings: Settings,
    node: any,
    newPredecessors: any[],
    level: number,
    drawStart: number,
    sizePerc: number,
    subtreeColour: any,
  ) {

    // Only draw if the node is rendered wide enough
    if (sizePerc >= 1 / settings.minRenderSize) {

      // If no node is given (so no root was selected)
      if (!node) {
        var totalDegree = 0;

        // Calculate total degree for all nodes
        graph.forEachNode((node, attributes) => {
          if (settings.edgeType == 'incoming') {
            if (graph.inDegree(node) > 0) {
              totalDegree += graph.inDegree(node);
            }
          } else if (settings.edgeType == 'outgoing') {
            if (graph.outDegree(node) > 0) {
              totalDegree += graph.outDegree(node);
            }
          } else {
            if (graph.degree(node) > 0) {
              totalDegree += graph.degree(node);
            }
          }
        });

        let index = 0;

        // Draw subtrees
        graph.forEachNode((node, attributes) => {

          var newSizePerc = 0;

          if (settings.edgeType == "incoming") {
            newSizePerc = graph.inDegree(node);
          } else if (settings.edgeType == "outgoing") {
            newSizePerc = graph.outDegree(node);
          } else {
            newSizePerc = graph.degree(node);
          }

          if (newSizePerc > 0) {

            newSizePerc /= totalDegree;

            var convertedColour;

            if (settings.colourType === "rainbow") {
              convertedColour = this.getColour(settings, index.toString());
            } else {
              convertedColour = this.getColour(settings, this.attributesColourMap.get(attributes[settings.colourType]));
            }

            predecessors = [];

            // Start at level 1 for sunburst diagram if no node is given
            if (settings.variety === "sunburst") {
              level = 1;
            }

            this.drawDiagram(graph, app, settings, node, predecessors, level, drawStart, newSizePerc, convertedColour);
            drawStart += newSizePerc;
            index += 1;
          }
        });
        this.createLegendMap()
      } else {

        // Draw node
        this.drawNode(app, settings, node, level, drawStart, sizePerc, subtreeColour);

        // Add this node to copy of predecessors
        var predecessors = [...newPredecessors];
        predecessors.push(node);

        // Next layer
        if (level < settings.height - 1) {

          var downstreamConnections = 0;

          // Count downstream connections
          graph.forEachNeighbor(node, (neighbour, attributes) => {

            if (!this.isPredecessor(predecessors, neighbour)) {

              if (settings.edgeType == "incoming") {
                downstreamConnections += this.outConnections.get(neighbour + ">" + node);
              } else if (settings.edgeType == "outgoing") {
                downstreamConnections += this.outConnections.get(node + ">" + neighbour);
              } else {
                downstreamConnections += this.bothConnections.get(node + "_" + neighbour);
              }

            }
          });

          // Calculate child size and draw
          graph.forEachNeighbor(node, (neighbour, attributes) => {
            if (!this.shouldDrawEdge(predecessors, node, neighbour, settings)) return;

            if (settings.colourType !== "rainbow") subtreeColour = this.getColour(settings, this.attributesColourMap.get(attributes[settings.colourType]));

            var newSizePerc = 0;

            if ((settings.edgeType === "incoming") && (this.outConnections.get(neighbour + ">" + node) > 0)) {
              newSizePerc = sizePerc * this.outConnections.get(neighbour + ">" + node) / downstreamConnections;

              this.drawDiagram(graph, app, settings, neighbour, predecessors, level + 1, drawStart, newSizePerc, subtreeColour);
              drawStart += newSizePerc;

            } else if ((settings.edgeType === "outgoing") && (this.outConnections.get(node + ">" + neighbour) > 0)) {
              newSizePerc = sizePerc * this.outConnections.get(node + ">" + neighbour) / downstreamConnections;

              this.drawDiagram(graph, app, settings, neighbour, predecessors, level + 1, drawStart, newSizePerc, subtreeColour);
              drawStart += newSizePerc;

            } else if ((settings.edgeType !== "incoming") && (settings.edgeType !== "outgoing") && (this.bothConnections.get(node + "_" + neighbour) > 0)) {
              newSizePerc = sizePerc * this.bothConnections.get(node + "_" + neighbour) / downstreamConnections;

              this.drawDiagram(graph, app, settings, neighbour, predecessors, level + 1, drawStart, newSizePerc, subtreeColour);
              drawStart += newSizePerc;
            }
          });
        }
      }
    }
  },

  // Check if node is in the list of predecessors
  isPredecessor(predecessors: any[], neighbour: any) {
    for (let index = 0; index < predecessors.length; index++) {
      if (predecessors[index] == neighbour) {
        return true;
      }
    }
    return false;
  },

  getColour(settings: Settings, key: string) {
    const colourFunction = d3.color(this.colours(key));
    if (!colourFunction) return "0xffffff";
    return colourFunction.formatHex().replace("#", "0x") || "0xffffff";
  },

  shouldDrawEdge(predecessors: any[], node: string, neighbor: string, settings: Settings): boolean {
    if (!this.dataset) return false;
    if (this.isPredecessor(predecessors, neighbor)) return false;
    if (settings.edgeType === "incoming") {
      return containsEdgeInRange(this.dataset, node, neighbor, settings.timeRange);
    } else if (settings.edgeType === "outgoing") {
      return containsEdgeInRange(this.dataset, neighbor, node, settings.timeRange);
    } else {
      return containsEdgeInRange(this.dataset, node, neighbor, settings.timeRange) ||
        containsEdgeInRange(this.dataset, neighbor, node, settings.timeRange);
    }
  },

  // Draw node
  drawNode(app: PIXI.Application, settings: Settings, node: any, level: any, drawStart: any, sizePerc: any, nodeColour: any) {
    // Create graphics
    const drawnNode = new PIXI.Graphics();
    const graphicsList = this.graphicsMap.get(node);
    if (graphicsList) {
      graphicsList.push(drawnNode);
    } else {
      this.graphicsMap.set(node, [drawnNode]);
    }

    drawnNode.beginFill(nodeColour);
    drawnNode.lineStyle(1, 0xFFFFFF);

    if (settings.variety === "sunburst") {

      var startAngle = 2 * Math.PI * drawStart;
      var endAngle = 2 * Math.PI * (drawStart + sizePerc);
      var minRadius = level * this.levelHeight;
      var maxRadius = minRadius + this.levelHeight;

      if (level == 0) {
        drawnNode.drawCircle(0, 0, maxRadius);
      } else {
        drawTorus(drawnNode, 0, 0, minRadius, maxRadius, startAngle, endAngle);
      }

      drawnNode.x = this.centerX;
      drawnNode.y = this.centerY;

    } else if (settings.variety === "flame") {

      drawnNode.drawRect(0, 0, this.maxWidth * sizePerc, this.levelHeight);

      drawnNode.x = this.centerX - (this.maxWidth / 2) + (this.maxWidth * drawStart);
      drawnNode.y = this.centerY + (this.maxHeight / 2) - (this.levelHeight * (level + 1));

    } else {

      drawnNode.drawRect(0, 0, this.maxWidth * sizePerc, this.levelHeight);

      drawnNode.x = this.centerX - (this.maxWidth / 2) + (this.maxWidth * drawStart);
      drawnNode.y = this.centerY - (this.maxHeight / 2) + (this.levelHeight * level);

    }

    drawnNode.endFill();
    app.stage.addChild(drawnNode);

    // Interactivity
    drawnNode.interactive = true;
    drawnNode.buttonMode = true;

    // Set root on click
    drawnNode.on('click', (event) => {
      event.stopPropagation();

      const diagram = this.diagram;
      if (!diagram) { // is not supposed to happen
        console.warn("Diagram missing");
        return;
      }
      const mouseEvent = event.data.originalEvent as MouseEvent;

      if (mouseEvent.shiftKey) { // shift-click
        // redraw graph is the user presses the node in the middle
        if ((level == 0) && (sizePerc == 1)) {
          GlobalStorage.changeSetting(diagram, "root", null, "diagramColour", nodeColour);
        } else {
          GlobalStorage.changeSetting(diagram, "root", node, "diagramColour", nodeColour);
        }
      } else {
        // non-shift-click means selecting --> brush-and-link interactivity
        this.$emit("selected-node-change", diagram.graphID, node, mouseEvent.ctrlKey);
      }
    });

    // Show node name on hover
    drawnNode.on('pointerover', (event) => {
      event.stopPropagation();

      this.infotoolDisplay = "inline";

      // Reset HTML
      this.infotool_value_list = [];

      // Node ID
      if (level == 0) {
        this.infotool_value_list.push("<h2 style='font-size: 16px;'> Root Node: " + node + "</h2>");
      } else {
        this.infotool_value_list.push("<h2 style='font-size: 16px;'> Node: " + node + "</h2>");
      }

      // Node degree and neighbours
      this.infotool_value_list.push("<hr><br><p> Incoming Degree: " + this.graph.inDegree(node) + "</p><p> Incoming Neighbours: " + this.graph.inNeighbors(node).length + "</p><br><p> Outgoing Degree: " + this.graph.outDegree(node) + "</p><p> Outgoing Neighbours: " + this.graph.outNeighbors(node).length + "</p><br>");

      // Attributes
      for (const [key, attribute] of Object.entries(this.graph.getNodeAttributes(node))) {
        if (key === settings.colourType) {
          if (key === "community") {
            this.infotool_value_list.push("<p style='text-decoration: underline;'> Clustering Community: " + attribute + "</p>");
          } else {
            this.infotool_value_list.push("<p style='text-decoration: underline;'>" + key + ": " + attribute + "</p>");
          }
        } else {
          if (key === "community") {
            this.infotool_value_list.push("<p> Clustering Community: " + attribute + "</p>");
          } else {
            this.infotool_value_list.push("<p>" + key + ": " + attribute + "</p>");
          }
        }
      }

      this.infotool_value_list.push("<br><hr><p style='font-style: italic'> Click for brush-and-link selection </p><p style='font-style: italic'> Ctrl+Click for multiple nodes </p><br>");

      if (level == 0) {
        this.infotool_value_list.push("<p style='font-style: italic'> Shift click to reset root </p>");
      } else {
        this.infotool_value_list.push("<p style='font-style: italic'> Shift click to set as root </p>");
      }

      const canvasParent = this.$refs["canvas-parent"] as HTMLElement;
      const rectangle = canvasParent.getBoundingClientRect();
      const mouseEvent = event.data.originalEvent as MouseEvent;

      this.infotoolXPos = Math.min(
        mouseEvent.clientX + 20,
        rectangle.left + canvasParent.clientWidth - 250,
      );
      this.infotoolYPos = Math.min(
        mouseEvent.clientY + 20,
        rectangle.top + canvasParent.clientHeight - 250,
      );
    });

    // Hide node name after hover
    drawnNode.on('pointerout', (event) => {
      event.stopPropagation();

      this.infotoolDisplay = "none";
    });
  },

  // Create map for legend.
    createLegendMap() {
      this.colorMap = new Map<string, {
        title: string,
        id: number,
        assignedColor: string,
      }>();
      for (const [key, value] of this.attributesColourMap.entries()) {
        const c = d3.color(this.colours(value));
        const colour = c?.formatHex() || '#181818';
        this.colorMap.set(key, {
          title: key,
          id: value,
          assignedColor: colour,
        })
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
        // globalstorage in the current situation
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
});
</script>
