<template>
  <div class="diagram-panel">
    <component :is="componentName" :diagramid="diagram_id"></component>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ArcDiagram from "@/components/vis-type/ArcDiagram.vue";
import SunburstDiagram from "@/components/vis-type/SunburstDiagram.vue";
import * as GlobalStorage from "@/scripts/globalstorage";

export default defineComponent({
  name: "DiagramPanel",

  components: { ArcDiagram, SunburstDiagram },

  props: {
    diagram_id: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      componentName: "",
    };
  },

  created() {
    const diagram = GlobalStorage.getDiagram(this.diagram_id);
    if (!diagram) {
      console.warn("Non-existent diagram", this.diagram_id);
      return;
    }
    this.componentName = diagram.type;
  },

  mounted() {
    console.log(this.componentName);
  },
});
</script>

<style lang="scss" scoped>
@import "../../assets/styles/_config.scss";

.diagram-panel {
  @include setSize(100%, 100%);
  background-color: $WHITE;
  border-radius: 5px;
  margin: 0px 3px;
  box-shadow: 2px 2px 4px rgba($BLACK_DDD, 0.25);
}
</style>
