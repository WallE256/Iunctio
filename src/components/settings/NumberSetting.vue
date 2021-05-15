<template>
  <div>
    <label :for="settingid">{{ settinglabel }}</label>
    <input type="number" :name="settingid" value="0" v-on:change="onChange" :min="min" :max="max" />
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
    min: {
      type: Number,
      default: () => 0,
    },
    max: {
      type: Number,
      default: () => 10000000,
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

      const target = event.target as HTMLInputElement;
      const number = parseInt(target.value);
      if (!isNaN(number) && number >= this.min && number <= this.max) {
        GlobalStorage.changeSetting(diagram, this.$props.settingid, number);
      }
    },
  },
});
</script>
