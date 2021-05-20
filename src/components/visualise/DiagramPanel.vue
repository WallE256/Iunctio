<template>
  <div class="diagram-panel"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "DiagramPanel",
});
</script>

<style lang="scss" scoped>
@import "../../assets/styles/_config.scss";

.diagram-panel {
  @include setSize(100%, 100%);
  background-color: $WHITE;
  border-radius: 5px;
  margin: 0px 3px;
  box-shadow: 2px 2px 4px rgba($BLACK_DDD, 0.25);
}
</style>
