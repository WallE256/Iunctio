<template>
  <div ref="diagram" style="height: 100%; width: 100%;">
    <div id="canvas-parent" ref="canvas-parent" style="height: 100%; width: 100%;">
      <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Graph from "graphology";
import { debounce } from "lodash";
import * as PIXI from "pixi.js";
import * as GlobalStorage from "@/scripts/globalstorage";

type Settings = {
  variety: string,
  dataType: string,
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
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      dateY: 0,
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

      const dateText = new PIXI.Text(dateISO.substr(0, dateISO.indexOf('T')), {fontSize: 15, align: 'center'});
      dateText.x = posX;
      dateText.y = posY;
      dateText.anchor.set(0.5, 0);

      app.stage.addChild(dateText);
    },

    /*drawLine(app: PIXI.Application, startX: number, startY: number, endX: number, endY: number) {

      const line = new PIXI.Graphics();

      line.lineStyle(0.666, 0x878787);

      line.moveTo(startX, startY).lineTo(endX, endY);

      app.stage.addChild(line);
    },*/

    // Draw the diagram
    draw(
      app: PIXI.Application,
      settings: Settings,
    ) {
      app.stage.removeChildren();

      const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

      const borderPerc = 0.1;

      this.minX = canvas.width * borderPerc;
      this.minY = canvas.height * borderPerc;
      this.maxX = canvas.width * (1 - borderPerc);
      this.maxY = canvas.height * (1 - borderPerc);
      this.dateY = this.maxY;

      if (settings.dataType === "avg-sentiment" || settings.dataType === "tot-sentiment") this.maxY /= 2;

      var intervalUTC = [this.dateToUTC(this.interval[0]), this.dateToUTC(this.interval[1])];
      var intervalTimeUTC = intervalUTC[1] - intervalUTC[0];

      const secondsPerDay = 1000 * 60 * 60 * 24;
      const dayWidth = secondsPerDay / intervalTimeUTC * (this.maxX - this.minX);

      const windowDisFromMiddle = Math.floor(this.window.length / 2);

      var mapValue = 0;
      var maxHeight = 0;

      let edgeMap = new Map();
      let valMap = new Map();

      // Put graph info on timeline (map)
      this.graph.forEachEdge((edge: any) => {
        var edgeDate = this.dateToUTC(this.attrDateToDate(this.graph.getEdgeAttribute(edge, 'date')));
        var mapValue = edgeMap.get(edgeDate);
        if (isNaN(mapValue)) {
          edgeMap.set(edgeDate, 1);
          if (settings.dataType === "tot-sentiment" || settings.dataType === "avg-sentiment") valMap.set(edgeDate, parseFloat(this.graph.getEdgeAttribute(edge, 'sentiment')));
        } else {
          edgeMap.set(edgeDate, mapValue + 1);
          if (settings.dataType === "tot-sentiment" || settings.dataType === "avg-sentiment") valMap.set(edgeDate, mapValue + parseFloat(this.graph.getEdgeAttribute(edge, 'sentiment')));
        }
      });

      var dateMap = null;

      if (settings.dataType === "avg-sentiment") {

        for (let [key, value] of valMap) {
          let edgeVal = edgeMap.get(key);
          let finalVal = value / edgeVal;

          if (isNaN(value)) finalVal = 0;

          if (settings.logarithmic) {
            if (finalVal > 0) finalVal = Math.log(finalVal * 100000);
            else if (finalVal < 0) finalVal = Math.log(finalVal * -100000) * -1;
            else finalVal = 0;
          }

          valMap.set(key, finalVal);
        }

        dateMap = new Map(valMap);

      } else if (settings.dataType === "tot-sentiment") {
        if (settings.logarithmic) {
          for (let [key, value] of valMap) {
            if (value > 0) valMap.set(key, Math.log(value));
            else if (value < 0) valMap.set(key, Math.log(value * -1) * -1);
            else valMap.set(key, 0);
          }
        }
        dateMap = new Map(valMap);

      } else if (settings.logarithmic) {
        for (let [key, value] of edgeMap) {
          if (!isNaN(value) && (value != 0)) {
            edgeMap.set(key, Math.log(value));
          }
        }
        dateMap = new Map(edgeMap);

      } else dateMap = new Map(edgeMap);

      if (settings.variety === "distribution") {

        var points = [] as any[];
        points.push(this.minX, this.maxY);

        for (let i = intervalUTC[0]; i <= intervalUTC[1]; i += secondsPerDay) {
          mapValue = 0;

          for (let j = windowDisFromMiddle * -1; j <= windowDisFromMiddle; j++) {
            if (!isNaN(dateMap.get(i + j * secondsPerDay))) {
              mapValue += dateMap.get(i + j * secondsPerDay) * this.window[j + windowDisFromMiddle];
            }
          }

          if (Math.abs(mapValue) > maxHeight) {
            maxHeight = Math.abs(mapValue);
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
            var newXPos = (i - intervalUTC[0]) / intervalTimeUTC * (this.maxX - this.minX) + this.minX;
            var newYPos = this.maxY - ((mapValue / maxHeight) * (this.maxY - this.minY));

            points.push(newXPos, newYPos);
          }
        }

        points.push(this.maxX, this.maxY);

        if (settings.dataType === "edge-frequency") {

          const distribution = new PIXI.Graphics();

          distribution.beginFill(0x4287f5);
          distribution.drawPolygon(points);
          distribution.endFill();

          app.stage.addChild(distribution);

        } else {

          const distribution_positive = new PIXI.Graphics();
          const distribution_negative = new PIXI.Graphics();

          const positive_points = [] as number[];
          const negative_points = [] as number[];

          for (let index = 0; index < points.length; index += 2) {
            if (points[index + 1] <= this.maxY) {
              positive_points.push(points[index], points[index + 1]);
              negative_points.push(points[index], this.maxY);
            } else {
              positive_points.push(points[index], this.maxY);
              negative_points.push(points[index], points[index + 1]);
            }
          }

          distribution_positive.beginFill(0x2ea043);
          distribution_positive.drawPolygon(positive_points);
          distribution_positive.endFill();

          distribution_negative.beginFill(0xda3633);
          distribution_negative.drawPolygon(negative_points);
          distribution_negative.endFill();

          app.stage.addChild(distribution_positive);
          app.stage.addChild(distribution_negative);
        }
      } else {
        for (let value of dateMap.values()) {
          if (Math.abs(value) > maxHeight) {
            maxHeight = Math.abs(value);
          }
        }

        for (let i = intervalUTC[0]; i <= intervalUTC[1]; i += secondsPerDay) {
          mapValue = dateMap.get(i);

          if (!isNaN(mapValue) && mapValue != 0) {
            var newX = (i - intervalUTC[0]) / intervalTimeUTC * (this.maxX - this.minX) + this.minX;
            var newY = this.maxY - ((mapValue / maxHeight) * (this.maxY - this.minY));

            const histogramBar = new PIXI.Graphics();

            if (settings.dataType === "edge-frequency") histogramBar.beginFill(0x4287f5);
            else if (mapValue > 0) histogramBar.beginFill(0x2ea043);
            else if (mapValue < 0) histogramBar.beginFill(0xda3633);

            histogramBar.drawRect(newX, newY, dayWidth, this.maxY - newY);
            histogramBar.endFill();

            app.stage.addChild(histogramBar);
          }
        }
      }

      const stepSize = intervalTimeUTC / 5;

      this.drawDate(app, intervalUTC[0], this.minX, this.dateY);
      //this.drawLine(app, minX, maxY, minX, minY);

      for (let time = intervalUTC[0] + stepSize; time <= intervalUTC[1] - stepSize; time += stepSize) {
        const drawXPos = (time - intervalUTC[0]) / intervalTimeUTC * (this.maxX - this.minX) + this.minX;
        this.drawDate(app, time, drawXPos, this.dateY);
        //this.drawLine(app, drawXPos, maxY, drawXPos, minY);
      }

      this.drawDate(app, intervalUTC[1], this.maxX, this.dateY);
      //this.drawLine(app, maxX, maxY, maxX, minY);
    }
},
});
</script>
