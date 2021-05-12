<template>
  <div class="current-vis">
    <h3 class="current-vis__title">Your current visualisations.</h3>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "CurrentVisualisations",
});
</script>

<style scoped lang="scss">
@import "../../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");
.current-vis {
  padding: 0 40px;
  &__title {
    @include font-sans("Poppins", 1.25rem, "Medium", $BLACK_DDD);
  }
}
</style>
