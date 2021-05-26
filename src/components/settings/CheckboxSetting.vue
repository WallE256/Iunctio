<template>
  <div>
    <label :for="settingid">{{ settinglabel }}</label>
    <input type="checkbox" :name="settingid" v-on:change="onChange" />
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
  },

  methods: {
    onChange(event: Event) {
      const target = event.target as HTMLInputElement;
      this.$emit("setting-changed", this.$props.settingid, target.checked);
    },
  },
});
</script>
