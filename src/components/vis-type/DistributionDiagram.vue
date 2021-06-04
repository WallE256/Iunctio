<template>
  <div id="canvas-parent" ref="canvas-parent" style="margin: 0; padding: 0; height: 100%; width: 100%;">
    <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Graph from "graphology";
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
    const diagram = await GlobalStorage.getDiagram(this.diagramid);
    if (!diagram) {
      console.warn("Non-existent diagram:", this.diagramid);
      return;
    }
    const graph = await GlobalStorage.getDataset(diagram.graphID);
    if (!graph) {
      console.warn("Non-existent dataset:", diagram.graphID);
      return;
    }

    const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;
    const canvasParent = this.$refs["canvas-parent"] as HTMLElement;

    const app = new PIXI.Application({
      view: canvas,
      antialias: true,
      backgroundAlpha: 0,
      resizeTo: canvasParent,
    });

    const settings = diagram.settings as Settings;

    const window = [0.05, 0.1, 0.15, 0.4, 0.15, 0.1, 0.05];

    var interval = this.getInterval(graph);

    // this has to happen next tick because otherwise the element sizes are not
    // correct yet (because they've not been rendered yet)
    this.$nextTick(() => {
      app.resize();
      diagram.onChange = (diagram, changedKey) => {
        app.stage.removeChildren();
        this.draw(graph, app, settings, interval, window);
      };

      this.draw(graph, app, settings, interval, window);
    });
  },

  data() {
    return {
      // the node that you're currently hovering over
      hoverNode: null as string | null,
    };
  },

  methods: {
    getInterval(graph: Graph) {
      var minDate = new Date('9999-12-31 00:00');
        var maxDate = new Date('0000-01-01 00:00');
      graph.forEachEdge((edge) => {
        if (graph.hasEdgeAttribute(edge, 'date')) {
          var newDate = this.attrDateToDate(graph.getEdgeAttribute(edge, 'date'));

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

    // Draw the diagram
    draw(
      graph: Graph,
      app: PIXI.Application,
      settings: Settings,
      interval: any,
      window: any,
    ) {
      const canvas = this.$refs["drawing-canvas"] as HTMLCanvasElement;

      const borderPerc = 0.1;

      const minX = canvas.width * borderPerc;
      const minY = canvas.height * borderPerc;
      const maxX = canvas.width * (1 - borderPerc);
      const maxY = canvas.height * (1 - borderPerc);

      var intervalUTC = [this.dateToUTC(interval[0]), this.dateToUTC(interval[1])];
      var intervalTimeUTC = intervalUTC[1] - intervalUTC[0];

      const secondsPerDay = 1000 * 60 * 60 * 24;
      const dayWidth = secondsPerDay / intervalTimeUTC * (maxX - minX);

      const windowSize = window.length * secondsPerDay;
      const startPosition = intervalUTC[0] - windowSize;
      const windowDisFromMiddle = Math.floor(window.length / 2);

      var mapValue = 0;
      var maxHeight = 0;

      let dateMap = new Map();

      graph.forEachEdge((edge) => {
        var edgeDate = this.dateToUTC(this.attrDateToDate(graph.getEdgeAttribute(edge, 'date')));
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
              mapValue += dateMap.get(i + j * secondsPerDay) * window[j + windowDisFromMiddle];
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
              mapValue += dateMap.get(i + j * secondsPerDay) * window[j + windowDisFromMiddle];
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
    }
},
});
</script>
