<template>
  <canvas id="drawing-canvas" ref="drawing-canvas" style="margin:0; padding:0;"></canvas>
  <p id="graph-tooltip" ref="graph-tooltip" style="position: fixed; user-select: none;"></p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as PIXI from "pixi.js";
import Graph from "graphology";
import { debounce } from "lodash";
import * as GlobalStorage from "@/scripts/globalstorage";

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

  mounted() {
    this.canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

    this.diagram = GlobalStorage.getDiagram(this.diagramid);
    if (!this.diagram) {
      console.warn("Non-existent diagram ID:", this.diagramid);
      return;
    }

    const graph = GlobalStorage.getDataset(this.diagram.graphID);
    if (!graph) {
      console.warn("Non-existent dataset:", this.diagram.graphID);
      return;
    }
    this.graph = graph;

    this.app = new PIXI.Application({
      view: this.canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: true,
      resizeTo: window,
    });
    this.app.stage.sortableChildren = true;
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
        tooltip.style.left = (circle.x + 40) + "px";
        tooltip.style.top = (circle.y + 60) + "px";

        const color = 0x00D737;
        circle.tint = 0xFF00FF;

        this.graph.forEachOutboundEdge(source,
        (edge, attributes, source, target: any, sourceAttributes, targetAttributes) => {
          //console.log(`Edge from ${source} to ${target}`);
          const targetData = this.nodeMap.get(target);
          if (typeof targetData === "undefined") return;
          targetData.circle.tint = color;

          attributes.arc.obj.tint = color;
          attributes.arc.obj.zIndex = 1;
        });
      });
      circle.on("mouseout", (event) => {
        event.stopPropagation();

        tooltip.style.display = "none";

        const color = 0x50D5E8;
        circle.tint = color;

        this.graph.forEachOutboundEdge(source, 
        (edge, attributes, source, target: any, sourceAttributes, targetAttributes) => {
          //console.log(`Edge from ${source} to ${target}`);
          const targetData = this.nodeMap.get(target);
          if (typeof targetData === "undefined") return;
          targetData.circle.tint = color;

          attributes.arc.obj.tint = 0x884444;
          attributes.arc.obj.zIndex = 0;
        });
      });

      this.nodeMap.set(source, {
        text: text,
        circle: circle,
        index: i,
      });
      i++;
    });

    this.diagram.onChange = (diagram, changedKey) => {
      this.draw(this.graph, this.app as PIXI.Application, diagram.settings);
    };
    this.draw(this.graph, this.app as PIXI.Application, this.diagram.settings);
  },

  created(){
    window.addEventListener(
      "resize",
      debounce((event) => {
        if (!this.diagram) {
          return;
        }
        this.handleResize(event, this.graph, this.app as PIXI.Application, this.diagram.settings as Settings);
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
      
      // the node that you're currently hovering over
      selectedIndex: null as number | null,
      app: null as null | PIXI.Application,
      graph: new Graph({
        //options
      }),
      diagram: null as GlobalStorage.Diagram | null,
      canvas: null as null | HTMLCanvasElement,
    };
  },

  methods: {
    handleResize(e: any, graph: Graph, app: PIXI.Application, settings: Settings) {
      
      // const gl = (this.canvas as HTMLCanvasElement).getContext("webgl2") as WebGL2RenderingContext;
      
      // I got this from stackoverflow idk if this works
      // just leave it here

      // const red = 1;
      // const green = 0.5;
      // const blue = 0.7;
      // const alpha = 1;
      // gl.clearColor(red, green, blue, alpha);
      // gl.clear(gl.COLOR_BUFFER_BIT);
      
      this.draw(graph, app, settings);
    },

    draw(graph: Graph, app: PIXI.Application, settings: Settings) {
      //const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
      const canvas = this.canvas as HTMLCanvasElement;

      const nodeRadius = graph.order == 0 ? 200 : Math.floor(200 / graph.order);
      const textStyle = new PIXI.TextStyle({
        fill: "#000000",
        fontSize: nodeRadius + 4,
      });

      app.stage.removeChildren();

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
      
      // NOTE: some forEach* callbacks have ": any", because graphology lies
      // about its types :(
      if (!settings.variety || settings.variety === "circle") {
        const textDistance = 40;
        const vertexRadius = Math.min(canvas.width, canvas.height) / 3 - textDistance;
        console.log(vertexRadius);
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
          app.stage.addChild(text);

          const circle = sourceData.circle;
          circle.clear();
          circle.lineStyle(4, 0xE06776, 0.2);
          circle.beginFill(0x50D5E8, 1);
          circle.drawCircle(0, 0, nodeRadius);
          circle.endFill();
          circle.x = centerX + vertexRadius * Math.cos(sourceData.index * angle);
          circle.y = centerY + vertexRadius * Math.sin(sourceData.index * angle);
          app.stage.addChild(circle);

          // draw outgoing edges
          graph.forEachOutboundEdge(source,
          (edge: any, edgeAttr, source, target: any, sourceAttr, targetAttr, undirected, generatedKey) => {
            const targetData = this.nodeMap.get(target);
            if (typeof targetData === "undefined") return;

            const fromX = centerX + vertexRadius * Math.cos(sourceData.index * angle);
            const fromY = centerY + vertexRadius * Math.sin(sourceData.index * angle);
            const toX = centerX + vertexRadius * Math.cos(targetData.index * angle);
            const toY = centerY + vertexRadius * Math.sin(targetData.index * angle);
            const edgeGraphics = new PIXI.Graphics()
              .lineStyle(2, 0x884444)
              .moveTo(fromX, fromY)
              .quadraticCurveTo(centerX, centerY, toX, toY);
            app.stage.addChild(edgeGraphics);

            const arcAttr:Attr = {
              obj: edgeGraphics,
              x: centerX,
              y: centerY,
              radius: 1, //?
              style: 0x0,
            }
            graph.setEdgeAttribute(edge, "arc", arcAttr);
          });
        });
      } else if (settings.variety === "line") {
        const nodeLineY = canvas.height * 3/4;
        let nodeLineX = canvas.width * 1/8;
        let gap = Math.floor(canvas.width/(1.2 * graph.order));

        graph.forEachNode((source: any, sourceAttr) => {
          const sourceData = this.nodeMap.get(source);
          if (typeof sourceData === "undefined") return; // not supposed to happen
          const text = sourceData.text;

          const circle = sourceData.circle;
          circle.clear();
          circle.lineStyle(0);
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
            style: 0x50D5E8,
            value: source,
            clicked: false,
          }

          //adding interactivity to button
          circle.interactive = true;
          circle.buttonMode = true;

          // TODO: should we also store the edges in a separate map???
          // hmmmm...I dont think it bothers us for now
          graph.setNodeAttribute(source, "circle", circleAttr);
          app.stage.addChild(circle, text);
        });

        //add edges as arcs
        graph.forEachEdge(
        (edge, attributes, source: any, target: any, sourceAttributes, targetAttributes) => {
          const arcEdge = new PIXI.Graphics();

          const sourceData = this.nodeMap.get(source);
          const targetData = this.nodeMap.get(target);
          if (typeof sourceData === "undefined" || typeof targetData === "undefined") return; // shouldn't happen
        
          //debugging stuff you can ignore it
          // console.log(`${source} ${sourceAttributes.circle.y}`);
          // console.log(`${target} ${targetAttributes.circle.y}`);
          // console.log('--------------------------------')
          const distanceBetweenNodes = Math.abs(sourceAttributes.circle.x - targetAttributes.circle.x)
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
          arcEdge.lineStyle(2, 0x884444);
          arcEdge.arc(arcAttr.x, arcAttr.y, arcAttr.radius, arcAttr.startAngle as number, arcAttr.endAngle as number)

          app.stage.addChild(arcEdge);
        });
      } else {
        console.warn("Unrecognized shape", settings.variety);
      }
    }
  },
});
</script>
