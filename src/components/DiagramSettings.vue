<template>
  <div>
    <h1>{{ settingsName(type) }} Settings</h1>
    <span class="settings-close" @click="$emit('close-settings')" title="Close Settings"></span>
    <label CLASS="text-input">
      <span class="text-input__label">{{ "Diagram Name" }}</span>
      <input class="text-input__input" type="Diagram Name" name="diagramName" @change="onNameChanged($event.target.value)" :value="diagramname" placeholder="Diagram Name Placeholder" maxlength="30"/>
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
import { Setting, getVisibleSettings } from "@/scripts/settingconfig";

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
    diagramname: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      diagram: null as any,
      type: "",
      settings: [] as Setting[],
    };
  },

  async mounted() {
    this.diagram = await GlobalStorage.getDiagram(this.diagramid);
    if (!this.diagram) {
      console.warn("Non-existent diagram:", this.diagramid);
      return;
    }
    const dataset = await GlobalStorage.getDataset(this.diagram.graphID);
    if (!dataset) {
      console.warn("Non-existent data set:", this.diagram.graphID);
      return;
    }

    this.settings = getVisibleSettings(this.diagram, dataset.graph);
    this.type = this.diagram.type;
  },

  methods: {
    onSettingChanged(id: string, value: any) {
      this.$emit("setting-changed", id, value);
    },

    onNameChanged(name: string) {
      if (!this.diagram) {
        console.warn("Non-existent diagram:", this.diagramid);
        return;
      }

      GlobalStorage.changeName(this.diagram, name);
      this.$emit("name-changed", name);
    },

    settingsName(type: string) {
      let diag_type = "";
      switch (type) {
        case "ArcDiagram":
          diag_type = "Arc Diagram"
          break;

        case "SunburstDiagram":
          diag_type = "Sunburst Diagram"
          break;

        case "DistributionDiagram":
          diag_type = "Distribution Diagram"
          break;

        case "AdjacencyMatrix":
          diag_type = "Adjacency Matrix"
          break;

        default:
          diag_type = "Arc Diagram"
          break;
      }

      return diag_type;
    },
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
    margin: 0 15px 0 0px;
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

.settings-close {
  // Make the button circular.
  border-radius: 100%;
  @include setSize(25px);
  cursor: pointer;
  @include abs(10px 5px 0 0);

  &::after,
  &::before {
    @include pseudo($height: 75%, $width: 3px);
    top: 50%;
    left: 50%;
    background: $GREY;
    @include transition(background transform, 0.3s, $ease1);
  }

  &::after {
    transform: translate(-50%, -50%) rotateZ(-45deg);
  }

  &::before {
    transform: translate(-50%, -50%) rotateZ(45deg);
  }

  &:hover.settings-close::after {
    background: $RED;
    transform: translate(-50%, -50%) rotateZ(-45deg) scale(1.1);
  }

  &:hover.settings-close::before {
    background: $RED;
    transform: translate(-50%, -50%) rotateZ(45deg) scale(1.1);
  }
}
</style>
