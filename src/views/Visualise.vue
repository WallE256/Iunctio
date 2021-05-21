<template>
  <main class="visualise">
    <create-visualisations v-show="show_vis_home" @tile-click="createNew" />
    <keep-alive
      ><upload-dataset v-show="show_upload" @back="toggleHome" :diagram_component="selectedDiagram" @dataset-upload="onUpload"
    /></keep-alive>
    <current-visualisations v-show="show_vis_home" />
    <div class="visualise__panels" v-show="show_panels">
      <diagram-panel v-for="diagram in shownDiagrams" :key="diagram" :diagram_id="diagram">
      </diagram-panel>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
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
      selectedDiagram: null as { name: string; icon: string } | null,
      shownDiagrams: [] as string[],
    };
  },
  methods: {
    toggleHome() {
      this.show_vis_home = !this.show_vis_home;
      this.show_upload = !this.show_upload;
    },

    createNew(component: any) {
      this.toggleHome();
      this.selectedDiagram = component;
    },

    onUpload(diagramID: string) {
      this.show_vis_home = true;
      this.show_upload = false;
      this.show_panels = true;
      console.log(diagramID);
      this.shownDiagrams.push(diagramID);
    },
  },
});
</script>

<style scoped lang="scss">
.visualise {
  // Occupy entire viewport height.
  height: 100%;
  // Prevent content under nav-bar
  padding: 50px 25px 25px 25px;

  &__panels {
    display: flex;
    flex-direction: row;
    height: 100%;
  }
}
</style>
