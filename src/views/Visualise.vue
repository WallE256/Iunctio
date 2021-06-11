<!--<template>-->
<!--  <main class="visualise">-->
<!--    <create-visualisations v-show="show_vis_home" @tile-click="requestUpload" />-->
<!--    <upload-dataset-->
<!--      v-show="show_upload"-->
<!--      @back="returnToHome"-->
<!--      :diagram_component="selectedDiagram"-->
<!--      @dataset-upload="onUpload"-->
<!--    />-->
<!--    <current-visualisations v-show="show_vis_home" />-->
<!--    <div class="visualise__panels" v-show="show_panels">-->
<!--      <diagram-panel v-for="diagram in shownDiagrams" :key="diagram" :diagram_id="diagram">-->
<!--      </diagram-panel>-->
<!--    </div>-->
<!--    <span class="visualise__back" v-show="!show_vis_home" @click="returnToHome">BACK</span>-->
<!--  </main>-->
<!--</template>-->

<template>
  <main class="visualise">
    <section class="upload-dataset">
      <h3 class="upload-dataset__title">Upload a new data set.</h3>
      <div class="upload-dataset__tiles">
        <dataset-tile
          v-for="dataset in datasets"
          :key="dataset"
          :id_name="dataset"
          @delete="updateDatasets"
        />
        <div class="upload-dataset__btn-container">
          <button class="upload-dataset__btn" @click="toggleUpload(true)" />
        </div>
      </div>
      <upload-panel v-if="show_upload" @toggle="toggleUpload" @upload="updateDatasets"/>
    </section>
    <section class="create-diagram">
      <h3 class="create-diagram__title">Create a new diagram.</h3>
      <div class="create-diagram__tiles">
        <create-diagram-tile
          v-for="diag in diagram_types"
          :key="diag.name"
          :name="diag.name"
          :path="diag.path"
          @tile-click="createDiagram"
        />
      </div>
    </section>
<!--    <section>-->
<!--      <div class="visualise__panels" v-show="show_panels">-->
<!--        <diagram-panel-->
<!--          v-for="diagram in shownDiagrams"-->
<!--          :key="diagram"-->
<!--          :diagram_id="diagram"-->
<!--          @selected-node-change="onSelectedNodeChange"-->
<!--        />-->
<!--      </div>-->
<!--    </section>-->
  </main>
</template>

<script lang="ts">
import { defineComponent, DefineComponent } from "vue";
import CreateDiagramTile from "@/components/visualise/CreateDiagramTile.vue";
import UploadPanel from "@/components/visualise/UploadPanel.vue";
import DatasetTile from "@/components/visualise/DatasetTile.vue";
import * as GlobalStorage from "@/scripts/globalstorage";

export default defineComponent({
  name: "Visualise",
  components: { CreateDiagramTile, UploadPanel, DatasetTile },
  data() {
    return {
      show_upload: false,
      selectedDiagram: null as DefineComponent | null,
      shownDiagrams: [] as string[],
      diagram_types: [
        { name: "Arc Diagram", path: "img/vis/arc-diagram.png" },
        { name: "SunBurst Diagram", path: "img/vis/sunburst.png" },
      ],
      datasets: [] as string[],
    };
  },
  async created() {
    // Retrieve the list of datasets from
    await this.updateDatasets();
  },

  methods: {
    createDiagram() {
      console.log("Diagram Created.");
    },
    async updateDatasets(str?: string) {
      this.datasets = await GlobalStorage.getDatasets();
      // Force an update, otherwise Vue doesn't remove the dataset-tile.
      this.$forceUpdate();
    },
    toggleUpload(visibility?: boolean) {
      this.show_upload = !this.show_upload;
    },

    // brush-and-link interactivity: update GlobalStorage and each diagram if
    // needed
    async onSelectedNodeChange(
      datasetID: string,
      nodeID: string,
      append: boolean
    ) {
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
        GlobalStorage.getDiagram(this.shownDiagrams[i]).then((diagram) => {
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

<style lang="scss" src="@/assets/styles/visualise.scss"></style>
