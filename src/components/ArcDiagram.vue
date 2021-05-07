<template>
  <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  <p id="graph-tooltip" ref="graph-tooltip" style="position: absolute;"></p>
</template>

<script lang="ts">
import { DefineComponent, defineComponent } from "vue";
import * as PIXI from "pixi.js";
import DirectedGraph from "graphology";
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
      { key: 25, attr: { name: "#1", index: 0 } },
      { key: 2, attr: { name: "#2", index: 0 } },
      { key: 3, attr: { name: "#three", index: 0 } },
      { key: 4, attr: { name: "for", index: 0 } },
      { key: 5, attr: { name: "5", index: 0 } },
      { key: 6, attr: { name: "#8", index: 0 } },
      { key: 7, attr: { name: "7", index: 0 } },
      { key: 8, attr: { name: "8", index: 0 } },
      { key: 9, attr: { name: "9", index: 0 } },
      { key: 10, attr: { name: "ten", index: 0 } },
      { key: 11, attr: { name: "XI", index: 0 } },
      { key: 12, attr: { name: "twelve", index: 0 } },
      { key: 13, attr: { name: "#thirteen", index: 0 } },
      { key: 14, attr: { name: "XIV", index: 0 } },
      { key: 15, attr: { name: "is", index: 0 } },
      { key: 16, attr: { name: "16", index: 0 } },
      { key: 17, attr: { name: "71", index: 0 } },
      { key: 18, attr: { name: "19-1", index: 0 } },
      { key: 19, attr: { name: "19-2", index: 0 } },
      { key: 20, attr: { name: "#20", index: 0 } },
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
      shape: "line", // or line
    };

    const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

    const graph = new DirectedGraph({
      //options
    });
    for (const { key, attr } of nodes) {
      graph.addNode(key, attr);
    }
    for (const { source, target, attr } of edges) {
      graph.addDirectedEdge(source, target, attr);
    }

    // give each node an index
    let i = 0;
    graph.forEachNode((source, sourceAttr) => {
      sourceAttr.index = i;
      i++;
    });

    const app = new PIXI.Application({
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: true,
    });

    this.draw(graph, app, input.shape === "circle");
  },

  methods: {
    draw(graph: DirectedGraph, app: PIXI.Application, circle: boolean) {
      const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
      const tooltip = this.$refs["graph-tooltip"] as HTMLElement;
      const vertexRadius = 240;
      const edgeRadius = vertexRadius - 20;
      const angle = (2 * Math.PI) / graph.order;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      app.stage.removeChildren();

      // https://pixijs.download/release/docs/PIXI.Graphics.html
      const graphics = new PIXI.Graphics();
      app.stage.addChild(graphics);

      if (circle) {
        graph.forEachNode((source, sourceAttr) => {
          const sourceString = source.toString();
          const text = new PIXI.Text(
            sourceString,
            new PIXI.TextStyle({
              fill: "#000000",
            })
          );
          text.anchor.set(0.5, 0.5);
          text.x = centerX + vertexRadius * Math.cos(sourceAttr.index * angle);
          text.y = centerY + vertexRadius * Math.sin(sourceAttr.index * angle);

          // tooltip display
          text.interactive = true;
          text.on("mousemove", (event) => {
            if (event.target !== text) {
              return;
            }
            event.stopPropagation();
            tooltip.style.display = "inline";
            tooltip.innerText = "Node: " + sourceString;
            tooltip.style.left = (event.data.global.x + 20) + "px";
            tooltip.style.top = (event.data.global.y + 20) + "px";
          });
          text.on("mouseout", (event) => {
            if (event.currentTarget !== text) {
              return;
            }
            event.stopPropagation();
            tooltip.style.display = "none";
          });

          app.stage.addChild(text);

          // draw outgoing edges
          graph.forEachOutboundNeighbor(source, (target, targetAttr) => {
            const fromX = centerX + edgeRadius * Math.cos(sourceAttr.index * angle);
            const fromY = centerY + edgeRadius * Math.sin(sourceAttr.index * angle);
            const toX = centerX + edgeRadius * Math.cos(targetAttr.index * angle);
            const toY = centerY + edgeRadius * Math.sin(targetAttr.index * angle);
            graphics
              .lineStyle(2, 0xff0000)
              .moveTo(fromX, fromY)
              .quadraticCurveTo(centerX, centerY, toX, toY);
          }); 
        });
      } else {
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
        const nodeRadius = Math.floor(200/graph.order); //hopefully no graph will have 0 nodes
        let nodeLineX = canvas.width * 1/8;
        let gap = Math.floor(canvas.width/(1.2*graph.order));
        const style = new PIXI.TextStyle({
                fill: "#000000",
                fontSize: nodeRadius+4
              });

       // console.log(graph.order, canvas.width, canvas.height)
        graph.forEachNode((source, sourceAttr) => {
            const sourceString = source.toString();
            const circle = new Graphics();
            circle.lineStyle(0);
            circle.beginFill(0xDE3249, 1);
            circle.drawCircle(0, 0, nodeRadius);
            circle.endFill();
            circle.x = nodeLineX + gap * sourceAttr.index;
            circle.y = nodeLineY;
            
            
            // node's value
            const text = new PIXI.Text(
              sourceString,
              style
            );
            text.anchor.set(0.5, 0.5);
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
            
            circle.on('click', (event)=> {
              const color = circleAttr.clicked ? 0xffffff : 0x666666;
              circleAttr.clicked = !circleAttr.clicked;
              circle.tint = color;
    
              graph.forEachOutboundEdge(source, 
              (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
                //console.log(`Edge from ${source} to ${target}`);
                targetAttributes.circle.obj.tint = color;
                attributes.arc.obj.tint = color;
              });
            });

            // tooltip display
            text.interactive = true;
            circle.on("mousemove", (event) => {
              if (event.target !== circle) {
                return;
              }
              event.stopPropagation();
              tooltip.style.display = "inline";
              tooltip.innerText = "Node: " + source.toString();
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
          
            graph.setNodeAttribute(source, 'circle', circleAttr);
            app.stage.addChild(circle, text);
          
        });

        

        //add edges as arcs
        graph.forEachEdge(
        (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
          const arcEdge = new PIXI.Graphics();
        
          //debugging stuff you can ignore it
          // console.log(`${source} ${sourceAttributes.circle.y}`);
          // console.log(`${target} ${targetAttributes.circle.y}`);
          // console.log('--------------------------------')
          const distanceBetweenNodes = Math.abs(sourceAttributes.circle.x - targetAttributes.circle.x)
          let xArcCenter: number;
          if(sourceAttributes.index > targetAttributes.index) {
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
