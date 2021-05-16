<template>
  <div
    tabindex="0"
    @click="selectDiagram"
    @keypress.enter="selectDiagram"
    class="vis-tile"
  >
    <div class="vis-tile__bg">
      <img :src="vis_type.icon" :alt="vis_type.name" class="vis-tile__icon" />
    </div>
    <h4 class="vis-tile__title">{{ vis_type.name }}</h4>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "NewVis",
  props: {
    vis_type: { required: true, type: Object },
  },
  methods: {
    selectDiagram() {
      this.$emit("tile-click");
    },
  },
});
</script>

<style scoped lang="scss">
@import "../../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");

.vis-tile {
  text-align: center;
  width: 120px;
  margin: 10px;
  cursor: pointer;

  &:hover,
  &:focus {
    outline: none;
    .vis-tile__bg {
      transform: scale(1.05);
    }
  }

  &:focus &__bg {
    border: 1px solid $WHITE;
  }

  &__bg {
    @include setSize(120px, 120px);
    background-color: $BLACK_L;
    padding: 5px;
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 5px;
    box-shadow: 2px 2px 4px rgba($BLACK_DDD, 0.25);
    @include transition(transform border, 0.3s, $ease2);

    .vis-tile__icon {
      max-width: 100%;
      max-height: 100%;
    }
  }

  &__title {
    @include font-sans("Poppins", 0.8rem, "Medium", $BLACK_DDD);
  }
}
</style>
