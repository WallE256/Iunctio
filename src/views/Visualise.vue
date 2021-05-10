<template>
  <arc-diagram></arc-diagram>
</template>

<!--<style>
  body {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
</style>-->

<script lang="ts">
import { defineComponent } from "vue";
import ArcDiagram from "@/components/vis-type/ArcDiagram.vue";
export default defineComponent({
  name: "Visualise",
  components: { ArcDiagram },
});
</script>
