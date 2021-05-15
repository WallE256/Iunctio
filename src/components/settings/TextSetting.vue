<template>
  <div>
    <label :for="settingid">{{ settinglabel }}</label>
    <input type="text" :name="settingid" v-on:change="onChange" />
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

      // onchange will only fire if the user presses enter or changes focus to
      // another element, so this doesn't actually fire after every key
      const target = event.target as HTMLInputElement;
      GlobalStorage.changeSetting(diagram, this.$props.settingid, target.value);
    },
  },
});
</script>
