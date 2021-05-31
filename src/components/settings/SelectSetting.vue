<template>
  <div>
    <label :for="settingid">{{ settinglabel }}</label>
    <select :name="settingid" v-on:change="onChange">
      <option v-for="option in options" :key="option" :selected="option === value">
        {{ option }}
      </option>
    </select>
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
    options: {
      type: Array,
      required: true,
    },
    value: {
      type: String,
      default: "",
    },
  },

  data() {
    return {
      timeout: null as number | null,
    };
  },

  methods: {
    onChange(event: Event) {
      const target = event.target as HTMLSelectElement;
      this.$emit(
        "setting-changed",
        this.$props.settingid,
        target.value,
      );
    },
  },
});
</script>
