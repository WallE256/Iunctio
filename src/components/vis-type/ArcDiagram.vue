<template>
  <div id="canvas-parent" ref="canvas-parent" style="margin: 0; padding: 0; height: 100%; width: 100%;">
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
  variety?: string, // "circle" or "line"
  hoverEdgeDirection?: string,
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
      const text = new PIXI.Text(
        sourceString,
        defaultStyle,
      );
      text.anchor.set(0.5, 0.5);

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
        circle.tint = 0xFE00EF;

        this.graph.forEachOutboundEdge(source,
        (edge, attributes, source: any, target: any, sourceAttributes, targetAttributes) => {
          const edgeKey = source + '->' + target;
          const targetData = this.nodeMap.get(target);
          const edgeData = this.edgeMap.get(edgeKey);
          
          if (typeof targetData === "undefined" || typeof edgeData === "undefined") return;
          targetData.circle.tint = color;
          if (edgeData.arc) { 
            edgeData.arc.tint = color;
            edgeData.arc.alpha = 5;
            edgeData.arc.zIndex = 1;
          } else if (edgeData.cord){
            edgeData.cord.tint = color;
            edgeData.cord.alpha = 5
            edgeData.cord.zIndex = 1;
          }
        });
      });

      circle.on("mouseout", (event) => {
        event.stopPropagation();

        tooltip.style.display = "none";

        const color = 0xffffff;
        circle.tint = color;

        this.graph.forEachOutboundEdge(source, 
        (edge, attributes, source, target: any, sourceAttributes, targetAttributes) => {
          //console.log(`Edge from ${source} to ${target}`);
          const edgeKey = source + '->' + target;
          const targetData = this.nodeMap.get(target);
          const edgeData = this.edgeMap.get(edgeKey);


          if (typeof targetData === "undefined" || typeof edgeData === "undefined") return;
          targetData.circle.tint = color;
          if (edgeData.arc) {
            edgeData.arc.tint = color;
            edgeData.arc.alpha = 1;
            edgeData.arc.zIndex = 0;
          } else if (edgeData.cord) {
            edgeData.cord.tint = color;
            edgeData.cord.alpha = 1;
            edgeData.cord.zIndex = 0;
          }
          
        });
      });

      this.nodeMap.set(source, {
        text: text,
        circle: circle,
        index: i,
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
      }>(),
      
      //edge map
      //the key is smth like '2->3'
      edgeMap: new Map<string,{
        id: number,
        cord?: PIXI.Graphics,
        arc?: PIXI.Graphics
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

      //TESTING
      //settings.shape = 'line'
      
      const textStyle = new PIXI.TextStyle({
        fill: "#000000",
        fontSize: nodeRadius + 4,
      });

      //app.stage.removeChildren();
      viewport.removeChildren();

      type Attr = {
        obj: PIXI.Graphics,
        x: number,
        y: number,
        radius: number,
        style: number,
        startAngle?: number|undefined,
        endAngle?: number|undefined,
        value?: number|string,
        clicked?: boolean,
      }
      
      
      let edgeId = 0;
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

          // draw outgoing edges
          graph.forEachOutboundEdge(source,
          (edge: any, edgeAttr, source, target: any, sourceAttr, targetAttr, undirected, generatedKey) => {
            const targetData = this.nodeMap.get(target);
            if (typeof targetData === "undefined") return;

            if(this.edgeMap.has(target+'->'+source)) {
              const existentEdge = this.edgeMap.get(target+'->'+source);
              if(typeof existentEdge === "undefined") return; //should never happen
              this.edgeMap.set((source+'->'+target), {id: existentEdge.id, cord: existentEdge.cord})
            } else {
              const fromX = centerX + vertexRadius * Math.cos(sourceData.index * angle);
              const fromY = centerY + vertexRadius * Math.sin(sourceData.index * angle);
              const toX = centerX + vertexRadius * Math.cos(targetData.index * angle);
              const toY = centerY + vertexRadius * Math.sin(targetData.index * angle);
              const edgeGraphics = new PIXI.Graphics()
                .lineStyle(2, 0xE06776, 0.2)
                .moveTo(fromX, fromY)
                .quadraticCurveTo(centerX, centerY, toX, toY);

              viewport.addChild(edgeGraphics);

              const arcAttr:Attr = {
                obj: edgeGraphics,
                x: centerX,
                y: centerY,
                radius: 1, //?
                style: 0x0,
              }
              graph.setEdgeAttribute(edge, "arc", arcAttr);
              this.edgeMap.set((source+'->'+target), {id: edgeId++, cord: edgeGraphics});
            }
            
          });
        });
      } else if (settings.variety === "line"){
        const nodeLineY = canvas.height * 5/6;
        let nodeLineX = canvas.width * 1/10;
        //let gap = Math.floor(canvas.width/(1.2 * graph.order));
        let gap = 30;
        let largestRadius = 0;

        graph.forEachNode((source: any, sourceAttr) => {
          const sourceData = this.nodeMap.get(source);
          if (typeof sourceData === "undefined") return; // not supposed to happen
          const text = sourceData.text;

          const circle = sourceData.circle;
          circle.clear();
          circle.lineStyle(1);
          circle.beginFill(0x50D5E8, 1);
          circle.drawCircle(0, 0, nodeRadius);
          circle.endFill();
          circle.x = nodeLineX + gap * sourceData.index;
          circle.y = nodeLineY;

          // node's value
          text.style = textStyle;
          text.x = circle.x;
          text.y = circle.y + nodeRadius + text.height;
          
          const circleAttr:Attr = {
            obj: circle,
            x: circle.x,
            y: circle.y,
            radius: nodeRadius,
            style: 0xDE3249,
            value: source,
            clicked: false,
          }

          //adding interactivity to button
          circle.interactive = true;
          circle.buttonMode = true;

          graph.setNodeAttribute(source, "circle", circleAttr);
          viewport.addChild(circle, text);
        });

        //add edges as arcs
        graph.forEachEdge(
        (edge, attributes, source: any, target: any, sourceAttributes, targetAttributes) => {
          //gets rid of redundant arcs
          if(this.edgeMap.has(target+'->'+source)) {
            const existentEdge = this.edgeMap.get(target+'->'+source);
            if(typeof existentEdge === "undefined") return; //should never happen
            this.edgeMap.set((source+'->'+target), {id: existentEdge.id, arc: existentEdge.arc})
          } else {
            const arcEdge = new PIXI.Graphics();
            const sourceData = this.nodeMap.get(source);
            const targetData = this.nodeMap.get(target);
            if (typeof sourceData === "undefined" || typeof targetData === "undefined") return; // shouldn't happen
          
            const distanceBetweenNodes = Math.abs(sourceAttributes.circle.x - targetAttributes.circle.x)
            largestRadius = Math.max(distanceBetweenNodes/2, largestRadius);

            let xArcCenter: number;
            if (sourceData.index > targetData.index) {
              xArcCenter = targetAttributes.circle.x + distanceBetweenNodes/2;
            } else {
              xArcCenter = sourceAttributes.circle.x + distanceBetweenNodes/2;
            }
            
            const arcAttr:Attr = {
              obj: arcEdge,
              x: xArcCenter,
              y: sourceData.circle.y,
              radius: distanceBetweenNodes/2,
              startAngle: Math.PI,
              endAngle: 2 * Math.PI,
              style: 0x0,
            }
            graph.setEdgeAttribute(edge, 'arc', arcAttr);
            arcEdge.lineStyle(2, 0xE06776, 0.2); 
            arcEdge.arc(arcAttr.x, arcAttr.y, arcAttr.radius, arcAttr.startAngle as number, arcAttr.endAngle as number)
            this.edgeMap.set((source+'->'+target), {id: edgeId++, arc: arcEdge});
            viewport.addChild(arcEdge);
          }
        
        });
      } else {
        console.warn("Unrecognized shape", settings.variety);
      }
    }
  },
});
</script>
