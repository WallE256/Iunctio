<template>
  <div>
    <label :for="settingid">{{ settinglabel }}</label>
    <input type="number" :name="settingid" value="0" v-on:change="onChange" :min="min" :max="max" />
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
      const target = event.target as HTMLInputElement;
      const number = parseInt(target.value);
      if (!isNaN(number) && number >= this.min && number <= this.max) {
        this.$emit("setting-changed", this.$props.settingid, number);
      }
    },
  },
});
</script>
