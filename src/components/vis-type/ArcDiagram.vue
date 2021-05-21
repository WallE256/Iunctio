<template>
  
  <canvas id="drawing-canvas" ref="drawing-canvas" style="margin:0; padding:0;"></canvas>
  <p id="graph-tooltip" ref="graph-tooltip" style="position: fixed;"></p>
</template>

<script lang="ts">
import { DefineComponent, defineComponent } from "vue";
import * as PIXI from "pixi.js";
import MultiDirectedGraph from "graphology";
import Node from "graphology";
import { debounce } from "lodash";
import { Viewport } from 'pixi-viewport';
import { Container } from "pixi.js";

export default defineComponent({
  mounted() {


    this.canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
    this.app = new PIXI.Application({
    view: this.canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    transparent: true,
    resizeTo: window,
    });
    //document.body.appendChild(this.app.view)

    //create viewport
    this.viewport = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        interaction: this.app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    })

    // add the viewport to the stage
    this.app.stage.addChild(this.viewport as Viewport)

    //activate plugins
    this.viewport
        .drag()
        .wheel()
        .decelerate()
        .clampZoom({maxScale:1});

    this.viewport.moveCenter(window.innerWidth / 2, window.innerHeight / 2)
    this.viewport.setZoom(0.5)

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
      { source: 20, target: 18, attr: {} },
      { source: 13, target: 2, attr: {} },
      { source: 10, target: 10, attr: {} },
    ];

    for(let i=26; i<=8000; i++) {
      const node = {key: i, attr: {name: ""}};
      nodes.push(node);
    }



    this.input = {
      shape: "line", // circle/line
    };

  

    for (const { key, attr } of nodes) {
      this.graph.addNode(key, attr);
    }

    let source = -1;
    let target = -1;
    let nrOfNodes = 8000;
    for(let i=0; i<3000; i++) {
      try{
        source = -1;
        target = -1;
        
        while(!this.graph.hasNode(source)) {
          source = Math.floor(Math.random() * nrOfNodes);
        }
        while(!this.graph.hasNode(target)) {
          target = Math.floor(Math.random() * nrOfNodes);
        }
        
        const edge = {source: source, target: target, attr: {}};
        edges.push(edge);
      } catch { continue }
    }

    for (const { source, target, attr } of edges) {
      try{
        this.graph.addDirectedEdgeWithKey((source+'->'+target),source, target, attr);
      } catch {continue}
      
    }


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
          } else if (edgeData.cord){
            edgeData.cord.tint = color;
            edgeData.cord.alpha = 5
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
          } else if (edgeData.cord) {
            edgeData.cord.tint = color;
            edgeData.cord.alpha = 1;
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

    this.draw(this.graph, this.app as PIXI.Application, this.input.shape === "circle", this.viewport as Viewport);
  },
  created(){
    window.addEventListener(
      "resize",
      debounce((event) => {
        this.handleResize(event, this.graph, this.app as PIXI.Application, this.input.shape as string, this.viewport as Viewport);
        }, 250)
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
      graph: new MultiDirectedGraph({
    //options
    }),
      input: {} as Input,
      canvas: null as null | HTMLCanvasElement,
    };
  },

  methods: {
    handleResize(e: any, graph: MultiDirectedGraph, app: PIXI.Application, input: string, viewport: Viewport) {
      
      // const gl = (this.canvas as HTMLCanvasElement).getContext("webgl2") as WebGL2RenderingContext;
      
      // I got this from stackoverflow idk if this works
      // just leave it here

      // const red = 1;
      // const green = 0.5;
      // const blue = 0.7;
      // const alpha = 1;
      // gl.clearColor(red, green, blue, alpha);
      // gl.clear(gl.COLOR_BUFFER_BIT);
      
      this.draw(graph, app as PIXI.Application, input === 'circle', viewport);
    },

    draw(graph: MultiDirectedGraph, app: PIXI.Application, circle: boolean, viewport: Viewport) {
      //const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
      const canvas = this.canvas as HTMLCanvasElement;

      const tooltip = this.$refs["graph-tooltip"] as HTMLElement;
      const vertexRadius = 240;
      const angle = 2 * Math.PI / (graph.order == 0 ? 1 : graph.order);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      //const nodeRadius = graph.order == 0 ? 200 : Math.floor(500 / graph.order);
      const nodeRadius = 10;
      const textDistance = 40;
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
      if (circle) {
        graph.forEachNode((source: any, sourceAttr) => {
          const sourceData = this.nodeMap.get(source);
          if (typeof sourceData === "undefined") return; // not supposed to happen

          const text = sourceData.text;
          text.style = textStyle;
          text.x = centerX + (vertexRadius + textDistance) * Math.cos(sourceData.index * angle);
          text.y = centerY + (vertexRadius + textDistance) * Math.sin(sourceData.index * angle);
          //app.stage.addChild(text);
          viewport.addChild(text);

          const circle = sourceData.circle;
          circle.clear();
          circle.lineStyle(1);
          circle.beginFill(0x50D5E8, 1);
          circle.drawCircle(0, 0, nodeRadius);
          circle.endFill();
          circle.x = centerX + vertexRadius * Math.cos(sourceData.index * angle);
          circle.y = centerY + vertexRadius * Math.sin(sourceData.index * angle);
          //app.stage.addChild(circle);
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
              //app.stage.addChild(edgeGraphics);
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
      } else {
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

          // TODO: should we also store the edges in a separate map???
          // hmmmm...I dont think it bothers us for now
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
            arcEdge.lineStyle(2, 0xE06776, 0.2); // I like this color but it has bugs
            arcEdge.arc(arcAttr.x, arcAttr.y, arcAttr.radius, arcAttr.startAngle as number, arcAttr.endAngle as number)
            this.edgeMap.set((source+'->'+target), {id: edgeId++, arc: arcEdge});
            //app.stage.addChild(arcEdge);
            viewport.addChild(arcEdge);
          }
        
        });
      }
    }
  },
});
</script>
