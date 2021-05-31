<template>
  <div class="diagram-panel">
    <div class="diagram-panel__canvas">
      <component :is="componentName" :diagramid="diagram_id"></component>
    </div>
    <diagram-settings :diagramid="diagram_id" @setting-changed="onSettingChanged" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ArcDiagram from "@/components/vis-type/ArcDiagram.vue";
import SunburstDiagram from "@/components/vis-type/SunburstDiagram.vue";
import DiagramSettings from "@/components/DiagramSettings.vue";
import * as GlobalStorage from "@/scripts/globalstorage";

export default defineComponent({
  name: "DiagramPanel",

  components: { DiagramSettings, ArcDiagram, SunburstDiagram },

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

  async created() {
    const diagram = await GlobalStorage.getDiagram(this.diagram_id);
    if (!diagram) {
      console.warn("Non-existent diagram", this.diagram_id);
      return;
    }
    this.componentName = diagram.type;
  },

  mounted() {
    console.log(this.componentName);
  },

  methods: {
    onSettingChanged(id: string, value: any) {
      const diagram = GlobalStorage.getDiagram(this.diagram_id);
      if (!diagram) {
        console.warn("Non-existent diagram:", this.diagram_id);
        return;
      }
      GlobalStorage.changeSetting(diagram, id, value);
    },
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
  @include font-face("Poppins", "Regular");
  @include font-sans("Poppins", 0.75rem, "Regular", $BLACK_DDD);
}
</style>
