<template>
  <div
    tabindex="0"
    @click="onClick"
    @keypress.enter="onClick"
    class="diag-tile"
  >
    <div class="diag-tile__bg">
      <img :src="path" :alt="name" class="diag-tile__icon" />
    </div>
    <h4 class="diag-tile__title">{{ name }}</h4>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    name: { required: true, type: String },
    path: { required: true, type: String },
  },
  methods: {
    onClick() {
      this.$emit("tile-click", this.name);
    },
  },
});
</script>

<style scoped lang="scss">
@import "../../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");

.diag-tile {
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

    .diag-tile__icon {
      max-width: 100%;
      max-height: 100%;
    }
  }

  &__title {
    @include font-sans("Poppins", 0.8rem, "Medium", $BLACK_DDD);
  }
}
</style>
