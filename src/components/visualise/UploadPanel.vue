<template>
  <div class="upload-panel-container">
    <section class="upload-panel">
      <div class="upload-panel__close" @click="$emit('toggle')"></div>
      <label tabindex="0" class="upload-panel__btn">
        <input
          type="file"
          accept="text/csv,.csv,.gexf"
          @change="parseDataset"
        />
        UPLOAD
      </label>
      <h5 class="upload-panel__hint">Upload your dataset here.</h5>
      <h6 class="upload-panel__sub-hint">
        Note: The dataset must be in a CSV or GEXF format.
      </h6>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as GlobalStorage from "@/scripts/globalstorage";
import { parse } from "@/scripts/parser";
import Graph from "graphology";

export default defineComponent({
  name: "UploadPanel",
  methods: {
    parseDataset(event: { target: HTMLInputElement }): void {
      const file = (event.target.files as FileList)[0];
      const filename = file.name.replace(/\.[^/.]+$/, "");
      const graphID = GlobalStorage.createID(filename);

      const onFinish = async (_: Graph) => {
        this.$emit("upload");
        // because Chrome/Safari weird, so we need to reset the <input>
        event.target.value = "";
      };

      parse(file, graphID, onFinish);
    },
  },
});
</script>

<style scoped lang="scss">
@import "../../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");
@include font-face("Poppins", "Regular");

.upload-panel-container {
  @include abs(f0 f0 f0 f0);
  z-index: ind("visualise", "upload-panel");
  background: rgba($BLACK_DD, 0.75);
  padding: 100px;
}
.upload-panel {
  height: 100%;
  background-color: $WHITE;
  border-radius: 5px;

  // Center the button and hints.
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  position: relative;

  &__close {
    // Make the button circular.
    border-radius: 100%;
    @include setSize(15px);
    cursor: pointer;
    @include abs(10px 0 0 10px);

    &::after {
      @include pseudo($height: 100%, $width: 3px);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotateZ(-45deg);
      background: $BLUE_D;
    }
    &::before {
      @include pseudo($height: 100%, $width: 3px);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotateZ(45deg);
      background: $BLUE_D;
    }
  }

  &__btn {
    input[type="file"] {
      display: none;
    }

    @include center_item();
    @include font-sans("Poppins", 1.25rem, "Medium", $BLACK_DDD);
    position: relative;
    margin-bottom: 15px;
    @include transition(background color, 0.25s, $ease1);
    @include setSize(200px, 50px);

    &:focus,
    &:hover {
      // Remove default outline on focus.
      outline: none;
      background-color: $AQUAMARINE;
      color: $WHITE;
    }

    // Give a button like effect.
    &::before {
      @include pseudo($width: 100%, $height: 100%);
      border-radius: 5px;
      border: 2px solid $AQUAMARINE;
    }
  }

  &__hint {
    @include font-sans("Poppins", 0.9rem, "Regular", $BLACK_DDD);
  }

  &__sub-hint {
    @include font-sans("Poppins", 0.75rem, "Regular", $GREY);
  }
}
</style>
