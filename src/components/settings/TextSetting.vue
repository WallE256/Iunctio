<template>
  <div>
    <label :for="settingid">{{ settinglabel }}</label>
    <input type="text" :name="settingid" v-on:change="onChange" :value="value" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    settingid: {
      type: String,
      required: true,
    },
    settinglabel: {
      type: String,
      required: true,
    },
    value: {
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
      // onchange will only fire if the user presses enter or changes focus to
      // another element, so this doesn't actually fire after every key
      const target = event.target as HTMLInputElement;
      this.$emit("setting-changed", this.$props.settingid, target.value);
    },
  },
});
</script>
