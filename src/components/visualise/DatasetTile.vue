<template>
  <div class="dataset-tile">
    <div class="dataset-tile__bg">
      <span class="data-del" @click="deleteDataset"></span>
      <span class="data-id">{{ id }}</span>
    </div>
    <h4 class="dataset-tile__title">{{ name }}</h4>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as GlobalStorage from "@/scripts/globalstorage";

export default defineComponent({
  data() {
    return {
      id: "",
      name: "",
    };
  },
  props: {
    id_name: { required: true, type: String },
  },
  mounted() {
    const re = /^(\d+)-(.*)/g;
    let id_name_split = re.exec(this.id_name);
    if (id_name_split) {
      this.id = "#" + id_name_split[1];
      this.name = id_name_split[2];
    } else {
      console.log("Invalid dataset-id.");
    }
  },
  methods: {
    deleteDataset() {
      GlobalStorage.removeDataset(this.id_name);
      this.$emit("delete_data", this.id_name);
    },
  },
});
</script>

<style scoped lang="scss">
@import "../../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");

.dataset-tile {
  text-align: center;
  margin: 10px;
  white-space: pre-wrap;
  background-color: $WHITE;
  box-shadow: 2px 2px 3px rgba($BLACK_DDD, 0.15);
  border-radius: 5px;

  &__bg {
    height: 80px;
    min-width: 80px;
    background-color: $BLACK_L;
    padding: 5px;
    border-radius: 5px;
    box-shadow: 2px 2px 4px rgba($BLACK_DDD, 0.25);
    @include transition(transform border, 0.3s, $ease2);
    position: relative;

    .data-del {
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
      &:hover.data-del::after {
        background: $RED;
        transform: translate(-50%, -50%) rotateZ(-45deg) scale(1.1);
      }
      &:hover.data-del::before {
        background: $RED;
        transform: translate(-50%, -50%) rotateZ(45deg) scale(1.1);
      }
    }

    .data-id {
      @include font-sans("Poppins", 1.1rem, "Medium", $GREY);
      @include abs(0 0 5px 5px);
    }
  }

  &__title {
    padding: 7px 3px;
    @include font-sans("Poppins", 0.8rem, "Medium", $BLACK_DDD);
  }
}
</style>
