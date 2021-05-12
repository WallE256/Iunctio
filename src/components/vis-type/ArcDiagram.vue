<template>
  <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  <p id="graph-tooltip" ref="graph-tooltip" style="position: absolute;"></p>
</template>

<script lang="ts">
import { DefineComponent, defineComponent } from "vue";
import * as PIXI from "pixi.js";
import MultiDirectedGraph from "graphology";
import Node from "graphology";
import { Application, Graphics } from "pixi.js";
import { debounce } from "lodash";

export default defineComponent({
  mounted() {
    const nodes = [
      { key: 25, attr: { name: "#1" } },
      { key: 2, attr: { name: "#2" } },
      { key: 3, attr: { name: "#three" } },
      { key: 4, attr: { name: "for" } },
      { key: 5, attr: { name: "5" } },
      { key: 6, attr: { name: "#8" } },
      { key: 7, attr: { name: "7" } },
      { key: 8, attr: { name: "8" } },
      { key: 9, attr: { name: "9" } },
      { key: 10, attr: { name: "ten" } },
      { key: 11, attr: { name: "XI" } },
      { key: 12, attr: { name: "twelve" } },
      { key: 13, attr: { name: "#thirteen" } },
      { key: 14, attr: { name: "XIV" } },
      { key: 15, attr: { name: "is" } },
      { key: 16, attr: { name: "16" } },
      { key: 17, attr: { name: "71" } },
      { key: 18, attr: { name: "19-1" } },
      { key: 19, attr: { name: "19-2" } },
      { key: 20, attr: { name: "#20" } },
    ];
    const edges = [
      { source: 25, target: 2, attr: {} },
      { source: 25, target: 3, attr: {} },
      { source: 6, target: 9, attr: {} },
      { source: 14, target: 16, attr: {} },
      { source: 2, target: 13, attr: {} },
      { source: 5, target: 18, attr: {} },
      { source: 20, target: 18, attr: {} }
    ];
    this.input = {
      shape: "circle", // circle/line
    };

    const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

    for (const { key, attr } of nodes) {
      this.graph.addNode(key, attr);
    }
    for (const { source, target, attr } of edges) {
      this.graph.addDirectedEdge(source, target, attr);
    }

    this.app = new PIXI.Application({
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: true,
    });

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

        const color = 0x666666;
        circle.tint = color;

        this.graph.forEachOutboundEdge(source,
        (edge, attributes, source, target: any, sourceAttributes, targetAttributes) => {
          //console.log(`Edge from ${source} to ${target}`);
          const targetData = this.nodeMap.get(target);
          if (typeof targetData === "undefined") return;
          targetData.circle.tint = color;

          attributes.arc.obj.tint = color;
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
          const targetData = this.nodeMap.get(target);
          if (typeof targetData === "undefined") return;
          targetData.circle.tint = color;

          attributes.arc.obj.tint = color;
        });
      });

      this.nodeMap.set(source, {
        text: text,
        circle: circle,
        index: i,
      });
      i++;
    });

    this.draw(this.graph, this.app as PIXI.Application, this.input.shape === "circle");
  },
  created(){
    window.addEventListener(
      "resize",
      debounce((event) => {
        this.handleResize(event, this.graph, this.app as PIXI.Application, this.input.shape as string);
      }, 250),
    )
  },
  
  data() {
    type Input = {
      shape?: string;
    }

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
      graph: new MultiDirectedGraph({
        //options
      }),
      input: {} as Input,
    };
  },

  methods: {
    handleResize(e: any , graph: MultiDirectedGraph, app: PIXI.Application, input: string) {
      this.draw(graph, app as PIXI.Application, input === 'circle');
    },

    draw(graph: MultiDirectedGraph, app: PIXI.Application, circle: boolean) {
      const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;

      const vertexRadius = 240;
      const angle = 2 * Math.PI / (graph.order == 0 ? 1 : graph.order);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const nodeRadius = graph.order == 0 ? 200 : Math.floor(200 / graph.order);
      const textDistance = 40;
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
      if (circle) {
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
          circle.lineStyle(0);
          circle.beginFill(0xDE3249, 1);
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
              .lineStyle(2, 0xFFFFFF)
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
      } else {
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
          circle.beginFill(0xDE3249, 1);
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
          arcEdge.lineStyle(2, 0xFFFFFF);
          arcEdge.arc(arcAttr.x, arcAttr.y, arcAttr.radius, arcAttr.startAngle as number, arcAttr.endAngle as number)

          app.stage.addChild(arcEdge);
        });
      }
    }
  },
});
</script>
