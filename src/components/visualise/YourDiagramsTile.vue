<template>
  <div
    tabindex="0"
    class="diag-tile"
    @keypress.enter="openDiagram"
  >
    <div class="diag-tile__bg">
      <span class="diag-del" @click="deleteDiagram"></span>
      <img :src="path" :alt="name" class="diag-tile__icon" @click="openDiagram"/>
    </div>
    <h4 class="diag-tile__title" @click="openDiagram">{{ name }}</h4>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as GlobalStorage from "@/scripts/globalstorage";

export default defineComponent({
  props: {
    id: { required: true, type: String },
    name: { required: true, type: String },
    path: { required: true, type: String },
  },
  methods: {
    deleteDiagram() {
      GlobalStorage.removeDiagramByID(this.id);
      this.$emit("delete_diag", this.id);
    },

    openDiagram() {
      this.$emit("tile-click", this.id.replaceAll(" ", ""));
    },
  },
});
</script>

<style scoped lang="scss">
@import "../../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");

.diag-tile {
  $SIZE: 140px;
  text-align: center;
  width: $SIZE;
  margin: 10px;
  cursor: pointer;

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
    margin-bottom: 5px;
    box-shadow: 2px 2px 4px rgba($BLACK_DDD, 0.25);
    @include transition(transform border, 0.3s, $ease2);

    @include center_item();

    .diag-del {
      // Make the button circular.
      border-radius: 100%;
      @include setSize(20px);
      cursor: pointer;
      @include abs(5px 5px 0 0);

      &::after,
      &::before {
        @include pseudo($height: 75%, $width: 3px);
        top: 50%;
        left: 50%;
        background: $GREY;
        @include transition(background transform, 0.3s, $ease1);
      }
      &::after {
        transform: translate(-50%, -50%) rotateZ(-45deg);
      }
      &::before {
        transform: translate(-50%, -50%) rotateZ(45deg);
      }
      &:hover.diag-del::after {
        background: $RED;
        transform: translate(-50%, -50%) rotateZ(-45deg) scale(1.1);
      }
      &:hover.diag-del::before {
        background: $RED;
        transform: translate(-50%, -50%) rotateZ(45deg) scale(1.1);
      }
    }

    .diag-tile__icon {
      @include setSize(90%);
    }
  }

  &__title {
    @include font-sans("Poppins", 0.8rem, "Medium", $BLACK_DDD);
  }
}
</style>
