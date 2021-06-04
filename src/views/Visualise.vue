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
      <diagram-panel
        v-for="diagram in shownDiagrams"
        :key="diagram"
        :diagram_id="diagram"
        @selected-node-change="onSelectedNodeChange"
      />
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
import * as GlobalStorage from "@/scripts/globalstorage";

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
      this.toggleHome(false);
      this.toggleUpload(true);
      this.togglePanels(false);
      this.selectedDiagram = component;
    },
    async onUpload(diagramID: string) {
      this.toggleHome(false);
      this.toggleUpload(false);
      this.togglePanels(true);
      this.shownDiagrams = await GlobalStorage.getDiagrams();
    },

    // brush-and-link interactivity: update GlobalStorage and each diagram if
    // needed
    async onSelectedNodeChange(datasetID: string, nodeID: string, append: boolean) {
      const nodes = GlobalStorage.selectedNodes;

      // remove it if already present, add it if not present yet (so toggle)
      let present = false;
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].datasetID === datasetID && nodes[i].nodeID === nodeID) {
          nodes.splice(i);
          present = true;
          break;
        }
      }
      if (!present) {
        if (!append) {
          nodes.length = 0;
        }
        nodes.push({
          datasetID,
          nodeID,
        });
      }

      // update every diagram that could have this node in it
      for (let i = 0; i < this.shownDiagrams.length; i++) {
        GlobalStorage.getDiagram(this.shownDiagrams[i])
        .then((diagram) => {
          if (!diagram) return;
          if (diagram.graphID !== datasetID) return;

          if (diagram.onChange) {
            diagram.onChange(diagram, "selectedNode");
          }
        });
      }
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
