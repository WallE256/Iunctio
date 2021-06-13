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
  },

  data() {
    return {
      diagram: null as any,
      settings: [] as Setting[],
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

    this.settings = getVisibleSettings(this.diagram, graph);
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
