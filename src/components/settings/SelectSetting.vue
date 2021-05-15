<template>
  <div>
    <label :for="settingid">{{ settinglabel }}</label>
    <select :name="settingid" v-on:change="onChange">
      <option v-for="option in options" :key="option">
        {{ option }}
      </option>
    </select>
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
    options: {
      type: Array,
      required: true,
    },
  },

  data() {
    return {
      timeout: null as number | null,
    };
  },

  methods: {
    onChange(event: Event) {
      const diagram = GlobalStorage.getDiagram(this.$props.diagramid);
      if (!diagram) {
        return;
      }

      const target = event.target as HTMLSelectElement;
      GlobalStorage.changeSetting(diagram, this.$props.settingid, target.value);
    },
  },
});
</script>
