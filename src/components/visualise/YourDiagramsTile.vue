<template>
  <div
    tabindex="0"
    class="diag-tile"
    @click="openDiagram"
    @keypress.enter="openDiagram"
  >
    <div class="diag-tile__bg" >
      <span class="diag-del" @click.stop="deleteDiagram"></span>
      <img :src="path" :alt="name" class="diag-tile__icon" @click="openDiagram"/>
    </div>
    <div class="diag-tile__data">
      <h4 class="diag_tile__name">{{ name }}</h4>
      <h4 class="diag-tile__id">ID: {{ id }}</h4>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as GlobalStorage from "@/scripts/globalstorage";

export default defineComponent({
  props: {
    id_name: { required: true, type: String },
    path: { required: true, type: String },
    dataset: {required: true, type: String}
  },
  data() {
    return {
      id: "",
      name: ""
    }
  },
  mounted() {
    const re = /^(\d+)-(.*)/g;
    let id_name_split = re.exec(this.id_name);
    if (id_name_split) {
      this.id = "#" + id_name_split[1];
      // Add space between each capital letter.
      id_name_split[2] = id_name_split[2].replace(/([a-z])([A-Z])/g, '$1 $2');
      this.name = id_name_split[2].replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    } else {
      console.log("Invalid id_name.");
    }
  },
  methods: {
    deleteDiagram() {
      GlobalStorage.removeDiagramByID(this.id_name);
      this.$emit("delete_diag", this.id_name);
    },

    openDiagram() {
      this.$emit("tile-click", this.id_name.replaceAll(" ", ""));
    },
  },
});
</script>

<style scoped lang="scss">
@import "../../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");

.diag-tile {
  $SIZE: 140px;
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

    position: relative;

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

  &__data {
    text-align: center;
    width: $SIZE;
    padding: 10px 5px;
    @include font-sans("Poppins", 0.8rem, "Medium", $BLACK_DDD);
    .diag-tile__id {
      color: $GREY;
    }
  }
}
</style>
