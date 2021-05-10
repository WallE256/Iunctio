<template>
  <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  <p id="graph-tooltip" ref="graph-tooltip" style="position: absolute;"></p>
</template>

<script lang="ts">
import { DefineComponent, defineComponent } from "vue";
import * as PIXI from "pixi.js";
import MultiDirectedGraph from "graphology";
import Node from "graphology";
import { Graphics } from "pixi.js";


//custom type for each node's circle so it can be redrawn
// type Attr = {
//   obj: PIXI.Graphics,
//   x: number,
//   y: number,
//   radius: number,
//   style: number,
//   startAngle?: number|undefined,
//   endAngle?: number|undefined,
//   value?: number|string,
//   clicked?: boolean
// }

//event listener
//I didn't figure out how to add this function inside the methods property
// const onButtonOver = (obj: PIXI.Graphics, objAttributes: Attr, hover: boolean, app: PIXI.Application) => {
//       //clear existing circle
//       obj.clear();
//       app.stage.removeChild(obj);

//       //redraw the circle
//       let color = hover? 0x282BDC:0xDE3249; 
//       console.log(objAttributes.x);
//       console.log(color)
//       const circle = new Graphics();
//       circle.lineStyle(0);
//       circle.beginFill(color, 1);
//       circle.drawCircle(objAttributes.x, objAttributes.y, objAttributes.radius);
//       circle.endFill();
//       app.stage.addChild(circle);
//     }

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
    const input = {
      shape: "circle", // or line
    };

    const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

    const graph = new MultiDirectedGraph({
      //options
    });
    for (const { key, attr } of nodes) {
      graph.addNode(key, attr);
    }
    for (const { source, target, attr } of edges) {
      graph.addDirectedEdge(source, target, attr);
    }

    const app = new PIXI.Application({
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: true,
    });

    const defaultStyle = new PIXI.TextStyle({
      fill: "#000000",
    });
    
    // give each node a corresponding index and corresponding text element
    let i = 0;
    graph.forEachNode((source: any, sourceAttr) => {
      const sourceString = source.toString();
      const text = new PIXI.Text(
        sourceString,
        defaultStyle,
      );
      text.anchor.set(0.5, 0.5);
      app.stage.addChild(text);
      this.nodeMap.set(source, {
        text: text,
        index: i,
      });
      i++;
    });

    this.draw(graph, app, input.shape === "circle");
  },

  data() {
    return {
      // node map
      nodeMap: new Map<number, {
        text: PIXI.Text,
        index: number,
      }>(),
      
      // the node that you're currently hovering over
      selectedIndex: null as number | null,
    };
  },

  methods: {
    draw(graph: MultiDirectedGraph, app: PIXI.Application, circle: boolean) {
      const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
      const tooltip = this.$refs["graph-tooltip"] as HTMLElement;
      const vertexRadius = 240;
      const edgeRadius = vertexRadius - 20;
      const angle = (2 * Math.PI) / graph.order;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // https://pixijs.download/release/docs/PIXI.Graphics.html
      const graphics = new PIXI.Graphics();
      app.stage.addChild(graphics);

      const nodeRadius = Math.floor(200 / graph.order); //hopefully no graph will have 0 nodes
      const textDistance = 40;
      const textStyle = new PIXI.TextStyle({
        fill: "#000000",
        fontSize: nodeRadius + 4,
      });

      // NOTE: some forEach* callbacks have ": any", because graphology lies
      // about its types :(
      if (circle) {
        graph.forEachNode((source: any, sourceAttr) => {
          const sourceString = source.toString();

          const sourceData = this.nodeMap.get(source);
          if (typeof sourceData === "undefined") return; // not supposed to happen

          const text = sourceData.text;
          text.style = textStyle;
          text.x = centerX + (vertexRadius + textDistance) * Math.cos(sourceData.index * angle);
          text.y = centerY + (vertexRadius + textDistance) * Math.sin(sourceData.index * angle);

          const circle = new Graphics();
          circle.lineStyle(0);
          circle.beginFill(0xDE3249, 1);
          circle.drawCircle(0, 0, nodeRadius);
          circle.endFill();
          circle.x = centerX + vertexRadius * Math.cos(sourceData.index * angle);
          circle.y = centerY + vertexRadius * Math.sin(sourceData.index * angle);

          // tooltip display
          circle.interactive = true;
          circle.buttonMode = true;
          circle.on("mousemove", (event) => {
            if (event.target !== circle) {
              return;
            }
            event.stopPropagation();
            tooltip.style.display = "inline";
            tooltip.innerText = "Node: " + sourceString;
            tooltip.style.left = (event.data.global.x + 20) + "px";
            tooltip.style.top = (event.data.global.y + 20) + "px";
          });
          circle.on("mouseout", (event) => {
            if (event.currentTarget !== circle) {
              return;
            }
            event.stopPropagation();
            tooltip.style.display = "none";
          });
          app.stage.addChild(circle);

          // draw outgoing edges
          graph.forEachOutboundNeighbor(source, (target: any, targetAttr) => {
            const targetData = this.nodeMap.get(target);
            if (typeof targetData === "undefined") return;

            const fromX = centerX + edgeRadius * Math.cos(sourceData.index * angle);
            const fromY = centerY + edgeRadius * Math.sin(sourceData.index * angle);
            const toX = centerX + edgeRadius * Math.cos(targetData.index * angle);
            const toY = centerY + edgeRadius * Math.sin(targetData.index * angle);
            graphics
              .lineStyle(2, 0xff0000)
              .moveTo(fromX, fromY)
              .quadraticCurveTo(centerX, centerY, toX, toY);
          }); 
        });
      } else {
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
          clicked?: boolean
        }

        const nodeLineY = canvas.height * 3/4;
        let nodeLineX = canvas.width * 1/8;
        let gap = Math.floor(canvas.width/(1.2 * graph.order));

        graph.forEachNode((source: any, sourceAttr) => {
            const sourceData = this.nodeMap.get(source);
            if (typeof sourceData === "undefined") return; // not supposed to happen
            const text = sourceData.text;

            const circle = new Graphics();
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
              clicked: false
            }


            //adding interactivity to button
            circle.interactive = true;
            circle.buttonMode = true;
            
            // circle.on('click', (event)=> {
            //   const color = circleAttr.clicked ? 0xffffff : 0x666666;
            //   circleAttr.clicked = !circleAttr.clicked;
            //   circle.tint = color;
    
            //   graph.forEachOutboundEdge(source, 
            //   (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
            //     //console.log(`Edge from ${source} to ${target}`);
            //     targetAttributes.circle.obj.tint = color;
            //     attributes.arc.obj.tint = color;
            //   });
            // });

            // tooltip display
            circle.on("mousemove", (event) => {
              if (event.target !== circle) {
                return;
              }
              event.stopPropagation();
              tooltip.style.display = "inline";
              tooltip.innerText = "Node: " + source.toString();
              tooltip.style.left = (event.data.global.x + 20) + "px";
              tooltip.style.top = (event.data.global.y + 50) + "px";

              const color = 0x666666;
              circle.tint = color;
              graph.forEachOutboundEdge(source, 
              (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
                //console.log(`Edge from ${source} to ${target}`);
                targetAttributes.circle.obj.tint = color;
                attributes.arc.obj.tint = color;
              });

            });

            circle.on("mouseout", (event) => {
              if (event.currentTarget !== circle) {
                return;
              }
              event.stopPropagation();
              tooltip.style.display = "none";

              const color = 0xffffff;
              circle.tint = color;
              graph.forEachOutboundEdge(source, 
              (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
                //console.log(`Edge from ${source} to ${target}`);
                targetAttributes.circle.obj.tint = color;
                attributes.arc.obj.tint = color;
              });
            });
          
            graph.setNodeAttribute(source, 'circle', circleAttr);
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
            y: sourceAttributes.circle.y,
            radius: distanceBetweenNodes/2,
            startAngle:Math.PI,
            endAngle: 2 * Math.PI,
            style: 0x0
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
