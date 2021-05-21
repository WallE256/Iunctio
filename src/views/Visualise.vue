<template>
  <main class="visualise">
    <create-visualisations v-show="show_vis_home" @tile-click="requestUpload" />
    <upload-dataset
      v-show="show_upload"
      @back="returnToHome"
      :diagram_component="selectedDiagram"
      @dataset-upload="onUpload"
    />
    <current-visualisations v-show="show_vis_home" />
    <div class="visualise__panels" v-show="show_panels">
      <diagram-panel v-for="diagram in shownDiagrams" :key="diagram" :diagram_id="diagram">
      </diagram-panel>
    </div>
    <span class="visualise__back" v-show="!show_vis_home" @click="returnToHome">BACK</span>
  </main>
</template>

<script lang="ts">
import { defineComponent, DefineComponent } from "vue";
import CreateVisualisations from "@/components/visualise/CreateVisualisations.vue";
import UploadDataset from "@/components/visualise/UploadDataset.vue";
import DiagramPanel from "@/components/visualise/DiagramPanel.vue";
import CurrentVisualisations from "@/components/visualise/CurrentVisualisations.vue";

export default defineComponent({
  name: "Visualise",
  components: { UploadDataset, CurrentVisualisations, DiagramPanel, CreateVisualisations },
  data() {
    return {
      show_vis_home: true,
      show_upload: false,
      show_panels: false,
      selectedDiagram: null as DefineComponent | null,
      shownDiagrams: [] as string[],
    };
  },
  methods: {
    toggleHome(visibility?: boolean) {
      if(!(visibility === undefined)) {
        this.show_vis_home = visibility;
      } else {
        this.show_vis_home = !this.show_vis_home;
      }
    },
    toggleUpload(visibility?: boolean) {
      if(!(visibility === undefined)) {
        this.show_upload = visibility;
      } else {
        this.show_upload = !this.show_vis_home;
      }
    },
    togglePanels(visibility?: boolean) {
      if(!(visibility === undefined)) {
        this.show_panels = visibility;
      } else {
        this.show_panels = !this.show_vis_home;
      }
    },
    returnToHome() {
      this.toggleHome(true);
      this.toggleUpload(false);
      this.togglePanels(false);
    },
    requestUpload(component: DefineComponent) {
      console.log(component);
      this.toggleHome(false);
      this.toggleUpload(true);
      this.togglePanels(false);
      this.selectedDiagram = component;
    },
    onUpload(diagramID: string) {
      this.toggleHome(false);
      this.toggleUpload(false);
      this.togglePanels(true);
      console.log(diagramID);
      this.shownDiagrams.push(diagramID);
    },
  },
});
</script>

<style scoped lang="scss">
@import "../assets/styles/_config.scss";
.visualise {
  // Occupy entire viewport height.
  height: 100%;
  // Prevent content under nav-bar
  padding: 50px 25px 25px 25px;
  position: relative;

  &__panels {
    display: flex;
    flex-direction: row;
    height: 100%;
  }
  &__back {
    @include font-sans("Poppins", 0.75rem, "Regular", $BLACK_DDD);
    @include abs();
    cursor: pointer;
    margin: 2px;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
