<template>
  <div class="upload-panel">
    <span class="upload-panel__back" @click="$emit('back')">BACK</span>
    <label tabindex="0" class="upload-panel__btn" @change="parseDataset">
      <input type="file" accept="text/csv" />
      UPLOAD
    </label>
    <h5 class="upload-panel__hint">Upload your dataset here.</h5>
    <h6 class="upload-panel__sub-hint">
      Note: The dataset must be in a CSV format.
    </h6>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as GlobalStorage from "@/scripts/globalstorage";
import { csvParse } from "@/scripts/parser";
import { uniqueId } from "lodash";

export default defineComponent({
  name: "UploadDataset",
  props: {
    diagram_component: {
      type: Object,
    },
  },
  methods: {
    parseDataset(event: { target: { files: File[] } }): void {
      if (!this.diagram_component) {
        console.warn("The diagram component is not passed");
        return;
      }

      const file = event.target.files[0];
      // Send the file to the web-worker for parsing.
      const graphID = file.name.replace(/\.[^/.]+$/, "");
      const diagramID = uniqueId(graphID);
      if (GlobalStorage.getDataset(graphID) == null)
        csvParse(file);

      GlobalStorage.addDiagram(new GlobalStorage.Diagram(
        diagramID,
        graphID,
        this.diagram_component.name,
      ));

      this.$emit("dataset-upload", diagramID);
    },
  },
});
</script>

<style scoped lang="scss">
@import "../../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");
@include font-face("Poppins", "Regular");
.upload-panel {
  height: 100%;
  background-color: $WHITE;

  // Center the button and hints.
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  position: relative;

  &__back {
    @include font-sans("Poppins", 0.75rem, "Regular", $BLACK_DDD);
    @include abs(30px 0 0 30px);
    cursor: pointer;

    &:hover {
      text-decoration: underline;
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
