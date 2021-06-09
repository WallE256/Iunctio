<template>
  <div>
    <label CLASS="text-input" for="diagramName">
      <span class="text-input__label">{{ "Diagram Name" }}</span>
      <input class="text-input__input" type="Diagram Name" name="diagramName" v-on:change="onNameChange" :value="this?.diagram.name" placeholder="Diagram Name Placeholder" />
    </label>
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
      diagram: null as GlobalStorage.Diagram | null,
      settings: [] as SettingConfig[],
    };
  },

  async mounted() {
    this.diagram = await GlobalStorage.getDiagram(this.diagramid);
    if (!this.diagram) {
      console.warn("Non-existent diagram:", this.diagramid);
      return;
    }
    const graph = await GlobalStorage.getDataset(this.diagram.graphID);
    if (!graph) {
      console.warn("Non-existent data set:", this.diagram.graphID);
      return;
    }

    // see UploadDataset.vue for setting default values
    switch (this.diagram.type) {
      case "ArcDiagram":
        this.settings = [
          { id: "variety", component: "SelectSetting", name: "Node-Link Diagram Variety", properties: {
            options: [ "circle", "line" ],
            value: this.diagram.settings.variety,
          } },
          { id: "edgeHighlightDirection", component: "SelectSetting", name: "Edge Highlight Direction", properties: {
            options: [ "incoming", "outgoing", "both" ],
            value: this.diagram.settings.hoverEdgeDirection,
          } },
        ];
        break;

      case "SunburstDiagram":
        this.settings = [
          { id: "variety", component: "SelectSetting", name: "Hierarchical Diagram Variety", properties: {
            options: [ "sunburst", "flame", "inverse-flame" ],
            value: this.diagram.settings.variety,
          } },
          { id: "root", component: "SelectSetting", name: "Root Node", properties: {
            options: ["[no root]"].concat(graph.nodes()), // TODO this has to show a proper name instead of IDs
            value: this.diagram.settings.root,
          } },
          { id: "edgeType", component: "SelectSetting", name: "Edge Direction", properties: {
            options: [ "incoming", "outgoing", "both" ],
            value: this.diagram.settings.edgeType,
          } },
          { id: "height", component: "NumberSetting", name: "Layer Count", properties: {
            min: 2,
            max: 10,
            value: this.diagram.settings.height,
          } },
          { id: "colourType", component: "SelectSetting", name: "Colour Determined By", properties: {
            options: [ "rainbow" ].concat(Object.keys(graph.getNodeAttributes(graph.nodes()[0]))),
            value: this.diagram.settings.colourType,
          } },
          { id: "minRenderSize", component: "NumberSetting", name: "Minimum Node Size 1/x", properties: {
            min: 1,
            value: this.diagram.settings.minRenderSize,
          } },
        ];
        break;

      default:
        console.warn("Non-existent diagram type:", this.diagram.type);
        this.settings = [];
        break;
    }
  },

  methods: {
    onSettingChanged(id: string, value: any) {
      this.$emit("setting-changed", id, value);
    },

    onNameChange(event: Event, value_name: string) {
      if (!this.diagram) {
        console.warn("Non-existent diagram:", this.diagramid);
        return;
      }
      this.diagram.name = value_name;
    }
  },
});
</script>

<style scoped lang="scss">
@import "../assets/styles/config";
.text-input {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 10px 0;

  &__label {
    margin: 0 15px 0 5px;
  }

  &__input {
    appearance: none;
    background: $GREY_L;
    border: 0;
    @include font-sans("Poppins", 0.75rem, "Regular", inherit);
    padding: 0.5rem;
    box-shadow: 1px 1px 2px rgba($BLACK_DDD, 0.2);
    margin-left: auto;
    margin-right: 0;
    width: 190px;
  }
}
</style>
