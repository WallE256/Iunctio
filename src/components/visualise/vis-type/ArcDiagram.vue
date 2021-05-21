<template>
  <canvas id="drawing-canvas" ref="drawing-canvas"></canvas>
  <p id="graph-tooltip" ref="graph-tooltip" style="position: absolute"></p>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "ArcDiagram",
  icon: "img/vis/arc-diagram.png",
});
</script>
