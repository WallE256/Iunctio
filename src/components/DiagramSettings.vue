<template>
  <div>
    <component
      v-for="setting in settings"
      :key="setting.id"
      :is="setting.component"
      :settingid="setting.id"
      :settinglabel="setting.name"
      v-bind="setting.properties"
      @setting-changed="onSettingChanged"
    />
  </div>
</template>

<script lang="ts">
// create as follows:
// <diagram-settings diagramid="id-here" />

import { defineComponent } from "vue";
import * as GlobalStorage from "@/scripts/globalstorage";
import CheckboxSetting from "@/components/settings/CheckboxSetting.vue";
import NumberSetting from "@/components/settings/NumberSetting.vue";
import SelectSetting from "@/components/settings/SelectSetting.vue";
import TextSetting from "@/components/settings/TextSetting.vue";

type SettingConfig = {
  id: string,
  component: string,
  name: string,
  properties?: any,
};

export default defineComponent({
  components: {
    CheckboxSetting,
    NumberSetting,
    SelectSetting,
    TextSetting,
  },

  props: {
    diagramid: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      settings: [] as SettingConfig[],
    };
  },

  mounted() {
    const diagram = GlobalStorage.getDiagram(this.$props.diagramid);
    if (!diagram) {
      console.warn("Non-existent diagram:", this.$props.diagramid);
      return;
    }
    const graph = GlobalStorage.getDataset(diagram.graphID);
    if (!graph) {
      console.warn("Non-existent data set:", diagram.graphID);
      return;
    }

    // see UploadDataset.vue for setting default values
    switch (diagram.type) {
      // TODO: give these diagrams a default value that corresponds
      case "ArcDiagram":
        this.settings = [
          { id: "variety", component: "SelectSetting", name: "Node-Link Diagram Variety", properties: {
            options: [ "circle", "line" ],
          } },
          { id: "hoverEdgeDirection", component: "SelectSetting", name: "Edge Direction", properties: {
            options: [ "incoming", "outgoing", "both" ],
          } },
        ];
        break;

      case "SunburstDiagram":
        this.settings = [
          { id: "variety", component: "SelectSetting", name: "Hierarhical Diagram Variety", properties: {
            options: [ "sunburst", "flame", "inverted-flame" ],
          } },
          { id: "rootNode", component: "SelectSetting", name: "Root Node", properties: {
            options: graph.nodes(), // TODO this has to show a proper name instead of IDs
          } },
          { id: "edgeDirection", component: "SelectSetting", name: "Edge Direction", properties: {
            options: [ "incoming", "outgoing", "both" ],
          } },
          { id: "layerCount", component: "NumberSetting", name: "Layer Count", properties: {
            min: 0,
            max: 10,
          } },
          { id: "minSize", component: "NumberSetting", name: "Minimum Node Size", properties: {
            min: 1,
          } },
        ];
        break;

      default:
        console.warn("Non-existent diagram type:", diagram.type);
        this.settings = [];
        break;
    }
  },

  methods: {
    onSettingChanged(id: string, value: any) {
      this.$emit("setting-changed", id, value);
    },
  },
});
</script>
