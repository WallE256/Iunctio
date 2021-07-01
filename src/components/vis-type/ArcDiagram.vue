<template>
  <div ref="diagram" style="height: 100%; width: 100%;">
    <div id="canvas-parent" ref="canvas-parent" style="height: 100%; width: 100%;">
      <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
    </div>
    <info-tool id="info-tool" ref="info-tool" v-bind:values="this.infotool_value_list" v-bind:style="'left: ' + this.infotoolXPos + 'px; top: ' + this.infotoolYPos + 'px; display: ' + this.infotoolDisplay + ';'"/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as PIXI from "pixi.js";
import Graph from "graphology";
import { debounce, random } from "lodash";
import * as GlobalStorage from "@/scripts/globalstorage";
import InfoTool from "@/components/visualise/InfoTool.vue";
import { Viewport } from 'pixi-viewport';
import { Cull } from '@pixi-essentials/cull';
import { Container } from '@pixi/display';
import * as d3 from "d3";

// see also scripts/settingconfig.ts
type Settings = {
  variety: string, // "circle" or "line"
  edgeHighlightDirection: string,
  filterJobtitle: string
};

type NodeData = {
  text: PIXI.Text,
  circle: PIXI.Graphics,
  index: number,
  edgeGraphics: PIXI.Graphics,
  inboundDegree: number,
  outboundDegree: number,
  jobTitle: string,
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

    const dataset = await GlobalStorage.getDataset(this.diagram.graphID);
    if (!dataset) {
      console.warn("Non-existent dataset:", this.diagram.graphID);
      return;
    }
    this.graph = dataset.graph;

    this.app = new PIXI.Application({
      view: canvas,
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
        //.decelerate() //this might lower perfomance a lot
        .clampZoom({maxScale:1});

    this.viewport.moveCenter(window.innerWidth / 2, window.innerHeight / 2);
    this.viewport.setZoom(0.4);

    this.infotool = this.$refs["info-tool"] as HTMLElement;

    const defaultStyle = new PIXI.TextStyle({
      fill: "#000000",
      fontSize: "26px",
    });

    // give each node a corresponding index and corresponding text element
    let i = 0;
    let colorIndex = 0;
    const sortedNodes = dataset.getClusteredNodes();
    for (const node of sortedNodes) {
      const attributes = this.graph.getNodeAttributes(node);
      const text = new PIXI.Text(attributes.email.substring(0, attributes.email.indexOf("@")), defaultStyle);

      const edgeGraphics = new PIXI.Graphics();
      const circle = new PIXI.Graphics();

      // infotool display
      circle.interactive = true;
      circle.buttonMode = true;
      circle.on("mouseover", (event) => {
        event.stopPropagation();

        this.infotoolDisplay = "inline";

        // Reset HTML
        this.infotool_value_list = [];

        // Node ID
        this.infotool_value_list.push("<h2 style='font-size: 16px;'> Node: " + node + "</h2><hr><br>");

        // Node degree and neighbours
        this.infotool_value_list.push("<p> Incoming Degree: " + this.graph.inDegree(node) + "</p><p> Incoming Neighbours: " + this.graph.inNeighbors(node).length + "</p><br><p> Outgoing Degree: " + this.graph.outDegree(node) + "</p><p> Outgoing Neighbours: " + this.graph.outNeighbors(node).length + "</p><br>");

        // Attributes
        for (const [key, attribute] of Object.entries(this.graph.getNodeAttributes(node))) {
          if (key === "community") {
            this.infotool_value_list.push("<p> Clustering Community: " + attribute + "</p>");
          } else {
            this.infotool_value_list.push("<p>" + key + ": " + attribute + "</p>");
          }
        }


        this.infotool_value_list.push("<br><hr><p style='font-style: italic'> Click for brush-and-link selection </p><p style='font-style: italic'> Ctrl+Click for multiple nodes </p>");

        const mouseEvent = event.data.originalEvent as MouseEvent;
        const rectangle = canvasParent.getBoundingClientRect();

        this.infotoolXPos = Math.min(
          mouseEvent.clientX + 20,
          rectangle.left + canvasParent.clientWidth - 250,
        );
        this.infotoolYPos = Math.min(
          mouseEvent.clientY + 20,
          rectangle.top + canvasParent.clientHeight - 250,
        );

        this.unhighlight();
        this.hoverNode = node;
        this.highlight();
      });

      circle.on("mouseout", (event) => {
        event.stopPropagation();

        this.infotoolDisplay = "none";

        this.unhighlight();
        this.hoverNode = null;
        this.highlight();
      });

      // select/brush-and-linking interactivity
      circle.on("click", (event) => {
        if (!this.diagram) {
          return;
        }
        const append = (event.data.originalEvent as MouseEvent).ctrlKey;
        this.$emit("selected-node-change", this.diagram.graphID, node, append);
      });

      this.nodeMap.set(node, {
        text: text,
        circle: circle,
        index: i,
        edgeGraphics: edgeGraphics,
        inboundDegree: this.graph.inDegree(node),
        outboundDegree: this.graph.outDegree(node),
        jobTitle: attributes.jobtitle,
      });

      if(!this.jobMap.has(attributes.jobtitle)) {
        const color = d3.schemeSet3[colorIndex++];
        this.jobMap.set(attributes.jobtitle, {
          id: colorIndex,
          assignedColor: parseInt(this.cssToHex(color), 16)
        })
      }
      i++;
    }

    // this has to happen next tick, otherwise the elements do not have their
    // size yet (because they've not been renderd yet)
    this.$nextTick(() => {
      const app = this.app as PIXI.Application;
      app.resize();

      diagram.addOnChange((diagram, changedKey) => {
        if (changedKey === "selectedNode") {
          // no need to redraw the entire diagram, just highlight some
          this.unhighlight();

          this.selectedNodes = GlobalStorage.selectedNodes
            .filter((node) => node.datasetID === diagram.graphID)
            .map((node) => node.nodeID);
          for (const node of this.selectedNodes) {
            const nodeData = this.nodeMap.get(node);
            if (nodeData) {
              nodeData.circle.tint = 0xffffff;
            }
          }

          this.highlight();
          return;
        }

        this.draw(this.graph, app, diagram.settings, this.viewport as Viewport);
        this.unhighlight();
        this.highlight();
      });
      this.draw(this.graph, app, diagram.settings, this.viewport as Viewport);
      //culling
      //this.culling(this.app as PIXI.Application, this.viewport as Viewport, this.graph);

      this.selectedNodes = GlobalStorage.selectedNodes
        .filter((node) => node.datasetID === diagram.graphID)
        .map((node) => node.nodeID);

      this.highlight();
    });

  },

  created() {
    window.addEventListener(
      "resize",
      debounce((event) => {
        if (!this.diagram) {
          return;
        }
        this.handleResize(
          event,
          this.graph,
          this.app as PIXI.Application,
          this.diagram.settings as Settings,
          this.viewport as Viewport
        );
      }, 250)
    );
  },

  data() {
    return {
      jobMap: new Map<string, {
        id: number,
        assignedColor: number
      }>(),
      // node map
      nodeMap: new Map<string, NodeData>(),

      // the node that you're currently hovering over
      selectedNodes: [] as string[],
      hoverNode: null as string | null,
      app: null as null | PIXI.Application,
      infotool: document.createElement('null'),
      infotool_value_list: [] as string[],
      infotoolXPos: 0,
      infotoolYPos: 0,
      infotoolDisplay: "none",
      viewport: null as null | Viewport,
      graph: new Graph({
        //options
      }),
      diagram: null as GlobalStorage.Diagram | null,
      canvas: null as null | HTMLCanvasElement,
    };
  },

  methods: {
    rgbToHex(rgbString: string) {
      const a = rgbString.split("(")[1].split(")")[0];
      const b = a.split(",");
      const c = b.map((x) => {             //For each array element
        x = parseInt(x).toString(16);      //Convert to a base16 string
        return (x.length==1) ? "0"+x : x;  //Add zero if we get only one character
      })
      return "0x"+c.join("");
    },

    cssToHex(cssString: string): string {
      return "0x"+ cssString.substring(1);
    },

    culling(app: PIXI.Application, viewport: Viewport, graph: Graph) {
      const cull = new Cull().addAll(viewport.children);
      app.loader.load(()=> {
      viewport.on('frame-end', () => {
        if((viewport as Viewport).dirty) {
          cull.cull(app.renderer.screen);
          viewport.dirty = false;

          //lvl of detail
          const zoom = viewport.scale.x;

          //the level points can be changed later
          const zoomingSteps = [0.2, 0.35, 0.5, 1];
          const zoomingStep = zoomingSteps.findIndex(zoomStep => zoom <= zoomStep);

          graph.forEachNode((node:any) => {
            const nodeObj = this.nodeMap.get(node);
            if(!nodeObj) {console.log("node does not exist"); return;}

            const nodeGFX = nodeObj.circle;
            const nodeText = nodeObj.text;

            nodeText.visible = zoomingStep > 1;
            //later we can change to only make nodes that have low degree
            //and their corresponding edges dissapear
            nodeGFX.visible = zoomingStep > 0;
          })
        }
      })
    })
    },
    saveSnapshot(app: PIXI.Application, viewport: Viewport) {

      const graphics = new PIXI.Graphics()
          .beginFill(0xFF0000)
          .drawCircle(0, 0, 50);

      let image = app.renderer.plugins.extract.image(graphics);
      viewport.addChild(image, 'image/jpeg', 1)

    },

    handleResize(e: any, graph: Graph, app: PIXI.Application, settings: Settings, viewport: Viewport) {
      if (this.canvas) {
        viewport.screenWidth = this.canvas.width;
        viewport.screenHeight = this.canvas.height;
      }
      this.draw(graph, app, settings, viewport);
      this.unhighlight();
      this.highlight();
    },

    draw(
      graph: Graph,
      app: PIXI.Application,
      settings: Settings,
      viewport: Viewport
    ) {
      const canvas = this.canvas as HTMLCanvasElement;

      //node radius has to be fixed size otherwise they become very small when adding too many nodes
      //const nodeRadius = graph.order == 0 ? 200 : Math.floor(500 / graph.order);
      let nodeRadius = 10;
      //---------------------------------------------

      const direction = settings.edgeHighlightDirection;
      const drawOutgoing = direction === "outgoing" || direction === "both";
      const drawIncoming = direction === "incoming" || direction === "both";
      const alpha = drawOutgoing && drawIncoming ? 0.1 : 0.2;

      viewport.removeChildren();

      // NOTE: some forEach* callbacks have ": any", because graphology lies
      // about its types :(
      if (!settings.variety || settings.variety === "circle") {
        const textDistance = 40;
        const vertexRadius = Math.min(canvas.width, canvas.height)*1.2 - textDistance;
        const angle = 2 * Math.PI / (graph.order == 0 ? 1 : graph.order);
        const centerX = viewport.center.x;
        const centerY = viewport.center.y;

        const nodeCount = graph.order;
        graph.forEachNode((source: any, sourceAttr) => {
          const sourceData = this.nodeMap.get(source);
          if (typeof sourceData === "undefined") return; // not supposed to happen
          if (settings.filterJobtitle === "None" || sourceData.jobTitle === settings.filterJobtitle) {
            const index = sourceData.index;
            const text = sourceData.text;
            text.x = centerX + (vertexRadius + textDistance) * Math.cos(sourceData.index * angle);
            text.y = centerY + (vertexRadius + textDistance) * Math.sin(sourceData.index * angle);
            if (index > nodeCount * 1/4 && index < nodeCount * 3/4) {
              text.anchor.set(1.0, 0.5);
              text.rotation = 2 * (index - nodeCount / 2) * Math.PI / nodeCount;
            } else {
              text.anchor.set(0.0, 0.5);
              text.rotation = 2 * index * Math.PI / nodeCount;
            }

            viewport.addChild(text);

            if(drawOutgoing) {
              nodeRadius = Math.min(30, Math.max(5 * Math.log(sourceData.outboundDegree), 5));
            } else {
              nodeRadius = Math.min(30, Math.max(5 * Math.log(sourceData.inboundDegree), 5));
            }

            const circleColor = this.jobMap.get(sourceAttr.jobtitle)?.assignedColor;

            const circle = sourceData.circle;
            circle.lineStyle(1);
            circle.beginFill(circleColor, 1);
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
              if(settings.filterJobtitle === "None" || targetData.jobTitle === settings.filterJobtitle) {

                const toX = centerX + vertexRadius * Math.cos(targetData.index * angle);
                const toY = centerY + vertexRadius * Math.sin(targetData.index * angle);

                edgeGraphics
                  .lineStyle(2, 0xE06776, alpha)
                  .moveTo(fromX, fromY)
                  .quadraticCurveTo(centerX, centerY, toX, toY);
              };
            };
            if (drawOutgoing) {
              graph.forEachOutboundNeighbor(source, callback);
            }
            if (drawIncoming) {
              graph.forEachInboundNeighbor(source, callback);
            }

            viewport.addChild(edgeGraphics);
          };
        });
      } else if (settings.variety === "line") {
        const centerX = viewport.center.x;
        const centerY = viewport.center.y;
        const nodeLineY = centerY + viewport.worldScreenHeight / 2.5;
        const nodeLineX = centerX - viewport.worldScreenWidth / 2.25;
        //let gap = Math.floor(canvas.width/(1.2 * graph.order));
        let gap = 35;

        // draw every node
        graph.forEachNode((source: any, sourceAttr) => {
          const sourceData = this.nodeMap.get(source);
          if (!sourceData) return; // not supposed to happen

          if(settings.filterJobtitle === "None" || sourceData.jobTitle === settings.filterJobtitle) {

            if(drawOutgoing) {
              nodeRadius = Math.min(30, Math.max(5 * Math.log(sourceData.outboundDegree), 5));
            } else {
              nodeRadius = Math.min(30, Math.max(5 * Math.log(sourceData.inboundDegree), 5));
            }

            const circleColor = this.jobMap.get(sourceAttr.jobtitle)?.assignedColor;
            const circle = sourceData.circle;
            circle.lineStyle(1);
            circle.beginFill(circleColor, 1);
            circle.drawCircle(0, 0, nodeRadius);
            circle.endFill();
            circle.x = nodeLineX + gap * sourceData.index;
            circle.y = nodeLineY;

            // node's value
            const text = sourceData.text;
            text.x = circle.x;
            text.y = circle.y + nodeRadius + text.height;
            text.anchor.set(0.0, 0.5);
            text.rotation = Math.PI / 2;

            viewport.addChild(circle, text);
          };
        });
        // draw every edge
        graph.forEachNode((source: any, sourceAttr) => {
          const sourceData = this.nodeMap.get(source);
          if (!sourceData) return;

          if(settings.filterJobtitle === "None" || sourceData.jobTitle === settings.filterJobtitle) {

            const edgeGraphics = sourceData.edgeGraphics;
            edgeGraphics.clear();

            const sourceX = sourceData.circle.x;
            const sourceY = sourceData.circle.y;
            const callback = (target: any, targetAttributes: any) => {
              const targetData = this.nodeMap.get(target);
              if (!targetData) return; // shouldn't happen
              if(settings.filterJobtitle === "None" || targetData.jobTitle === settings.filterJobtitle) {

                const targetX = targetData.circle.x;
                const radius = Math.abs(sourceX - targetX) / 2;
                const xArcCenter = (sourceX + targetX) / 2;

                edgeGraphics
                  .lineStyle(2, 0xE06776, alpha)
                  .arc(xArcCenter, sourceY, radius, Math.PI, 2 * Math.PI);
              }
            };
            if (drawOutgoing) {
              graph.forEachOutboundNeighbor(source, callback);
            }
            if (drawIncoming) {
              graph.forEachInboundNeighbor(source, callback);
            }

            viewport.addChild(edgeGraphics);
          }
        });
      } else {
        console.warn("Unrecognized shape", settings.variety);
      }
    },

    highlight() {
      const diagram = this.diagram;
      if (!diagram) return;

      const highlightNode = (node: string) => {
        const nodeData = this.nodeMap.get(node);
        if (!nodeData) return;
        const highlightColor = 0x00d737; // green

        nodeData.edgeGraphics.tint = highlightColor;
        nodeData.edgeGraphics.alpha = 5;
        nodeData.edgeGraphics.zIndex = 1;

        const callback = (target: any, targetAttributes: any) => {
          const targetData = this.nodeMap.get(target);
          if (!targetData) return;
          targetData.circle.tint = 0xfe00ef; // purple-ish
          targetData.edgeGraphics.zIndex = 1;
        };
        const direction = diagram.settings.edgeHighlightDirection;
        if (direction === "outgoing" || direction === "both") {
          this.graph.forEachOutboundNeighbor(node, callback);
        }
        if (direction === "incoming" || direction === "both") {
          this.graph.forEachInboundNeighbor(node, callback);
        }

        nodeData.circle.tint = highlightColor;
      };

      for (const node of this.selectedNodes) {
        highlightNode(node);
      }
      if (this.hoverNode) {
        highlightNode(this.hoverNode);
      }
    },

    unhighlight() {
      const diagram = this.diagram;
      if (!diagram) return;

      const unhighlightNode = (node: string) => {
        const nodeData = this.nodeMap.get(node);
        if (!nodeData) return;

        const color = 0xffffff;
        nodeData.circle.tint = color;

        nodeData.edgeGraphics.tint = color;
        nodeData.edgeGraphics.alpha = 1;
        nodeData.edgeGraphics.zIndex = 0;

        const callback = (target: any, targetAttributes: any) => {
          const targetData = this.nodeMap.get(target);
          if (!targetData) return;
          targetData.circle.tint = color;
          targetData.edgeGraphics.zIndex = 0;
        };
        const direction = diagram.settings.edgeHighlightDirection;
        if (direction === "outgoing" || direction === "both") {
          this.graph.forEachOutboundNeighbor(node, callback);
        }
        if (direction === "incoming" || direction === "both") {
          this.graph.forEachInboundNeighbor(node, callback);
        }
      };
      for (const node of this.selectedNodes) {
        unhighlightNode(node);
      }
      if (this.hoverNode) {
        unhighlightNode(this.hoverNode);
      }
    },
  },
});
</script>
