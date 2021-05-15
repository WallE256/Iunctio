<template>
  <div>
    <label :for="settingid">{{ settinglabel }}</label>
    <input type="checkbox" :name="settingid" v-on:change="onChange" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as GlobalStorage from "@/scripts/globalstorage";

export default defineComponent({
  props: {
    diagramid: {
      type: String,
      required: true,
    },
    settingid: {
      type: String,
      required: true,
    },
    settinglabel: {
      type: String,
      required: true,
    },
  },

  methods: {
    onChange(event: Event) {
      const diagram = GlobalStorage.getDiagram(this.$props.diagramid);
      if (!diagram) {
        return;
      }

      const target = event.target as HTMLInputElement;
      GlobalStorage.changeSetting(diagram, this.$props.settingid, target.checked);
    },
  },
});
</script>
