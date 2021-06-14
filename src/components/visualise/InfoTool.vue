<template>
  <div class="info-tool" id="info-tool" ref="info-tool" style="position: fixed; user-select: none;">
    <div :info="setInfoTool(values)">
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    values: {
      type: Array,
      required: true,
    },
  },

  async mounted() {
    this.infotool = this.$refs["info-tool"] as HTMLElement;
  },

  data() {
    return {
      value_array: this.values,
      infotool: document.createElement('null'),
    };
  },

  methods: {

    setInfoTool(values: string[]) {
      this.infotool.innerHTML = "";
      values.forEach(element => {
        this.infotool.innerHTML += element;
      });
    },
  },

});
</script>

<style scoped lang="scss">
@import "../../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");
.info-tool {
  display: inline;
  background-color: white;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.2);
  text-transform: capitalize;
  pointer-events: none;
}
</style>
