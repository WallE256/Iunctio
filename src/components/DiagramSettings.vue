<template>
  <div>
    <component
      v-for="setting in settings"
      :key="setting.id"
      :is="setting.component"
      :diagramid="this.diagramid"
      :settingid="setting.id"
      :settinglabel="setting.name"
      v-bind="setting.properties"
    >
    </component>
  </div>
</template>

<script lang="ts">
// create as follows:
// <diagram-settings diagram-id="id-here"></diagram-settings>

import { defineComponent } from "vue";
import * as GlobalStorage from "@/scripts/globalstorage";
import CheckboxSetting from "@/components/settings/CheckboxSetting.vue";
import NumberSetting from "@/components/settings/NumberSetting.vue";
import SelectSetting from "@/components/settings/SelectSetting.vue";
import TextSetting from "@/components/settings/TextSetting.vue";

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
      settings: [] as { id: string, component: string, name: string, properties?: any }[],
    };
  },

  mounted() {
    const diagram = GlobalStorage.getDiagram(this.$props.diagramid);
    if (!diagram) {
      console.warn("Non-existent diagram:", this.$props.diagramid);
      return;
    }

    switch (diagram.type) {
      case "arcdiagram":
        break;

      case "sunburst":
        break;

      default:
        console.warn("Non-existent diagram type:", diagram.type);
        break;
    }
  },
});
</script>
