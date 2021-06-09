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

  async mounted() {
    const diagram = await GlobalStorage.getDiagram(this.diagramid);
    if (!diagram) {
      console.warn("Non-existent diagram:", this.diagramid);
      return;
    }
    const graph = await GlobalStorage.getDataset(diagram.graphID);
    if (!graph) {
      console.warn("Non-existent data set:", diagram.graphID);
      return;
    }

    // see UploadDataset.vue for setting default values
    switch (diagram.type) {
      case "ArcDiagram":
        this.settings = [
          { id: "variety", component: "SelectSetting", name: "Node-Link Diagram Variety", properties: {
            options: [ "circle", "line" ],
            value: diagram.settings.variety,
          } },
          { id: "edgeHighlightDirection", component: "SelectSetting", name: "Edge Highlight Direction", properties: {
            options: [ "incoming", "outgoing", "both" ],
            value: diagram.settings.hoverEdgeDirection,
          } },
        ];
        break;

      case "SunburstDiagram":
        this.settings = [
          { id: "variety", component: "SelectSetting", name: "Hierarchical Diagram Variety", properties: {
            options: [ "sunburst", "flame", "inverse-flame" ],
            value: diagram.settings.variety,
          } },
          { id: "root", component: "SelectSetting", name: "Root Node", properties: {
            options: ["[no root]"].concat(graph.nodes()), // TODO this has to show a proper name instead of IDs
            value: diagram.settings.root,
          } },
          { id: "edgeType", component: "SelectSetting", name: "Edge Direction", properties: {
            options: [ "incoming", "outgoing", "both" ],
            value: diagram.settings.edgeType,
          } },
          { id: "height", component: "NumberSetting", name: "Layer Count", properties: {
            min: 2,
            max: 10,
            value: diagram.settings.height,
          } },
          { id: "colourType", component: "SelectSetting", name: "Colour Determined By", properties: {
            options: [ "rainbow" ].concat(Object.keys(graph.getNodeAttributes(graph.nodes()[0]))),
            value: diagram.settings.colourType,
          } },
          { id: "minRenderSize", component: "NumberSetting", name: "Minimum Node Size 1/x", properties: {
            min: 1,
            value: diagram.settings.minRenderSize,
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
