<template>
  <div id="canvas-parent" ref="canvas-parent" style="margin: 0; padding: 0; height: 100%; width: 100%;">
    <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Graph from "graphology";
import { debounce } from "lodash";
import * as d3 from "d3";
import * as PIXI from "pixi.js";
import * as GlobalStorage from "@/scripts/globalstorage";

type Settings = {
  variety: string,
  logarithmic: boolean,
};

export default defineComponent({
  props: {
    diagramid: {
      type: String,
      required: true,
    },
  },

  async mounted() {
    this.canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
    const canvasParent = this.$refs["canvas-parent"] as HTMLElement;

    const diagram = await GlobalStorage.getDiagram(this.diagramid);
    if (!diagram) {
      console.warn("Non-existent diagram:", this.diagramid);
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
      view: this.canvas,
      antialias: true,
      backgroundAlpha: 0,
      resizeTo: canvasParent,
    });

    this.window = [0.05, 0.1, 0.15, 0.4, 0.15, 0.1, 0.05];

    this.interval = this.getInterval();

    const app = this.app as PIXI.Application;

    // this has to happen next tick because otherwise the element sizes are not
    // correct yet (because they've not been rendered yet)
    this.$nextTick(() => {
      app.resize();
      diagram.addOnChange((diagram: GlobalStorage.Diagram, changedKey: string) => {
        app.stage.removeChildren();
        this.draw(app, diagram.settings);
      });

      this.draw(app, diagram.settings);
    });
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
      // the node that you're currently hovering over
      hoverNode: null as string | null,
      graph: null as any,
      diagram: null as GlobalStorage.Diagram | null,
      app: null as null | PIXI.Application,
      canvas: null as null | HTMLCanvasElement,
      interval: [] as Date[],
      window: [] as number[],
    };
  },

  methods: {
    handleResize(e: any, graph: Graph, app: PIXI.Application, settings: Settings) {
      this.draw(app, settings);
    },

    getInterval() {
      var minDate = new Date('9999-12-31 00:00');
        var maxDate = new Date('0000-01-01 00:00');
      this.graph.forEachEdge((edge: any) => {
        if (this.graph.hasEdgeAttribute(edge, 'date')) {
          var newDate = this.attrDateToDate(this.graph.getEdgeAttribute(edge, 'date'));

          if (newDate < minDate) {
            minDate = newDate;
          }

          if (newDate > maxDate) {
            maxDate = newDate;
          }
        }
      });

      return [minDate, maxDate];
    },

    attrDateToDate(date: any) {
      return new Date(date + " 00:00");
    },

    dateToUTC(date: Date) {
      return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    },

    utcToDate(date: number) {
      return new Date(date);
    },

    drawDate(app: PIXI.Application, date: any, posX: number, posY: number) {
      const dateISO = this.utcToDate(date).toISOString();

      const dateText = new PIXI.Text(dateISO.substr(0, dateISO.indexOf('T')), {fontSize: 18, align: 'center'});
      dateText.x = posX;
      dateText.y = posY;
      dateText.anchor.set(0.5, 0);

      app.stage.addChild(dateText);
    },

    drawLine(app: PIXI.Application, startX: number, startY: number, endX: number, endY: number) {

      const line = new PIXI.Graphics();

      line.lineStyle(0.666, 0x878787);

      line.moveTo(startX, startY).lineTo(endX, endY);

      app.stage.addChild(line);
    },

    // Draw the diagram
    draw(
      app: PIXI.Application,
      settings: Settings,
    ) {
      app.stage.removeChildren();

      const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

      const borderPerc = 0.1;

      const minX = canvas.width * borderPerc;
      const minY = canvas.height * borderPerc;
      const maxX = canvas.width * (1 - borderPerc);
      const maxY = canvas.height * (1 - borderPerc);

      var intervalUTC = [this.dateToUTC(this.interval[0]), this.dateToUTC(this.interval[1])];
      var intervalTimeUTC = intervalUTC[1] - intervalUTC[0];

      const secondsPerDay = 1000 * 60 * 60 * 24;
      const dayWidth = secondsPerDay / intervalTimeUTC * (maxX - minX);

      const windowSize = this.window.length * secondsPerDay;
      const startPosition = intervalUTC[0] - windowSize;
      const windowDisFromMiddle = Math.floor(this.window.length / 2);

      var mapValue = 0;
      var maxHeight = 0;

      let dateMap = new Map();

      this.graph.forEachEdge((edge: any) => {
        var edgeDate = this.dateToUTC(this.attrDateToDate(this.graph.getEdgeAttribute(edge, 'date')));
        var mapValue = dateMap.get(edgeDate);
        if (isNaN(mapValue)) {
          dateMap.set(edgeDate, 1);
        } else {
          dateMap.set(edgeDate, mapValue + 1);
        }
      });

      if (settings.logarithmic) {
        for (let [key, value] of dateMap) {
          dateMap.set(key, Math.log(value));
        }
      }

      if (settings.variety === "distribution") {

        var points = [] as any[];
        points.push(minX, maxY);

        const distribution = new PIXI.Graphics();

        for (let i = intervalUTC[0]; i <= intervalUTC[1]; i += secondsPerDay) {
          mapValue = 0;

          for (let j = windowDisFromMiddle * -1; j <= windowDisFromMiddle; j++) {
            if (!isNaN(dateMap.get(i + j * secondsPerDay))) {
              mapValue += dateMap.get(i + j * secondsPerDay) * this.window[j + windowDisFromMiddle];
            }
          }

          if (mapValue > maxHeight) {
            maxHeight = mapValue;
          }
        }

        for (let i = intervalUTC[0]; i <= intervalUTC[1]; i += secondsPerDay) {
          mapValue = 0;

          for (let j = windowDisFromMiddle * -1; j <= windowDisFromMiddle; j++) {
            if (!isNaN(dateMap.get(i + j * secondsPerDay))) {
              mapValue += dateMap.get(i + j * secondsPerDay) * this.window[j + windowDisFromMiddle];
            }
          }

          if (!isNaN(mapValue)) {
            var newXPos = (i - intervalUTC[0]) / intervalTimeUTC * (maxX - minX) + minX;
            var newYPos = maxY - ((mapValue / maxHeight) * (maxY - minY));

            points.push(newXPos, newYPos);
          }
        }

        points.push(maxX, maxY);

        distribution.beginFill(0x4287f5);
        distribution.drawPolygon(points);
        distribution.endFill();

        app.stage.addChild(distribution);
      } else {
        for (let value of dateMap.values()) {
          if (value > maxHeight) {
            maxHeight = value;
          }
        }

        for (let i = intervalUTC[0]; i <= intervalUTC[1]; i += secondsPerDay) {
          mapValue = dateMap.get(i);

          if (!isNaN(mapValue)) {
            var newX = (i - intervalUTC[0]) / intervalTimeUTC * (maxX - minX) + minX;
            var newY = maxY - ((mapValue / maxHeight) * (maxY - minY));

            const distribution = new PIXI.Graphics();
            distribution.beginFill(0x4287f5);
            distribution.drawRect(newX, newY, dayWidth, maxY - newY);
            distribution.endFill();

            app.stage.addChild(distribution);
          }
        }
      }

      const stepSize = intervalTimeUTC / 5;

      this.drawDate(app, intervalUTC[0], minX, maxY);
      this.drawLine(app, minX, maxY, minX, minY);

      for (let time = intervalUTC[0] + stepSize; time <= intervalUTC[1] - stepSize; time += stepSize) {
        const drawXPos = (time - intervalUTC[0]) / intervalTimeUTC * (maxX - minX) + minX;
        this.drawDate(app, time, drawXPos, maxY);
        this.drawLine(app, drawXPos, maxY, drawXPos, minY);
      }

      this.drawDate(app, intervalUTC[1], maxX, maxY);
      this.drawLine(app, maxX, maxY, maxX, minY);
    }
},
});
</script>
