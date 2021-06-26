<template>
  <div
    tabindex="0"
    @click="onClick"
    @keypress.enter="onClick"
    class="diag-tile"
  >
    <div class="diag-tile__bg">
      <img :src="path" :alt="type" class="diag-tile__icon" />
    </div>
    <h4 class="diag-tile__title">{{ type }}</h4>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    type: { required: true, type: String },
    path: { required: true, type: String },
  },
  methods: {
    onClick() {
      this.$emit("tile-click", this.type.replaceAll(" ", ""));
    },
  },
});
</script>

<style scoped lang="scss">
@import "../../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");

.diag-tile {
  $SIZE: 145px;
  text-align: center;
  width: $SIZE;
  margin: 10px;
  cursor: pointer;
  background-color: $WHITE;
  box-shadow: 2px 2px 3px rgba($BLACK_DDD, 0.15);
  border-radius: 5px;

  &:hover,
  &:focus {
    outline: none;
    .diag-tile__bg {
      transform: scale(1.05);
    }
  }

  &:focus &__bg {
    border: 1px solid $WHITE;
    transform: scale(1.05);
  }

  &__bg {
    @include setSize($SIZE);
    background-color: $BLACK_L;
    padding: 5px;
    border-radius: 5px;
    overflow: hidden;
    box-shadow: 2px 2px 4px rgba($BLACK_DDD, 0.25);
    @include transition(transform border, 0.3s, $ease2);

    @include center_item();

    .diag-tile__icon {
      @include setSize(90%);
    }
  }

  &__title {
    padding: 10px 5px;
    @include font-sans("Poppins", 0.8rem, "Medium", $BLACK_DDD);
  }
}
</style>
