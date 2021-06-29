<template>
  <main class="visualise">
    <section class="upload-dataset" v-if="show_home">
      <h3 class="upload-dataset__title">Your datasets</h3>
      <div class="upload-dataset__tiles">
        <dataset-tile
          v-for="dataset in dataset_list"
          :key="dataset.id"
          :id="dataset.id"
          :name="dataset.name"
          @delete_data="datasetDeleted"
        />
        <div class="upload-dataset__btn-container">
          <button class="upload-dataset__btn" @click="toggleUpload(true)" />
        </div>
      </div>
      <upload-panel
        v-if="show_upload"
        @toggle="toggleUpload"
        @upload="updateDatasets"
      />
    </section>
    <section class="create-diagram" v-if="show_home">
      <h3 class="create-diagram__title">Create a new diagram</h3>
      <div class="create-diagram__tiles">
        <create-diagram-tile
          v-for="diag in diagram_types"
          :key="diag.d_type"
          :type="diag.d_type"
          :path="diag.path"
          @tile-click="selectDiagram"
        />
      </div>
    </section>
    <section class="your-diagrams" v-if="show_home && (diagram_list.length > 0)">
      <h3 class="your-diagrams__title">Your diagrams</h3>
      <div class="your-diagrams__tiles">
        <your-diagrams-tile
          v-for="your_diag in diagram_list"
          :key="your_diag.id"
          :name="your_diag.name"
          :id_name="your_diag.id"
          :datasetID="your_diag.graphID"
          :path="your_diag.path"
          @tile-click="openDiagram"
          @delete_diag="diagramDeleted"
        />
      </div>
    </section>
    <section class="diagram-panels" v-show="show_panels">
      <diagram-panel
        class="diagram-panel"
        v-for="diag in shownDiagrams"
        :key="diag"
        :diagram_id="diag"
        @selected-node-change="onSelectedNodeChange"
        @name-changed="onNameChanged"
        @close="closeDiagram"
        @back="
          toggleHome(true);
          toggleDiagramPanels(false);"
      />
    </section>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import UploadPanel from "@/components/visualise/UploadPanel.vue";
import DiagramPanel from "@/components/visualise/DiagramPanel.vue";
import CreateDiagramTile from "@/components/visualise/CreateDiagramTile.vue";
import YourDiagramsTile from "@/components/visualise/YourDiagramsTile.vue";
import DatasetTile from "@/components/visualise/DatasetTile.vue";
import { getDefaultSettings } from "@/scripts/settingconfig";
import * as GlobalStorage from "@/scripts/globalstorage";

type DiagramInfo = {
  id: string,
  name: string,
  path: string,
  graphID: string,
};

type DatasetInfo = {
  id: string,
  name: string,
};

export default defineComponent({
  name: "Visualise",
  components: { CreateDiagramTile, YourDiagramsTile, UploadPanel, DatasetTile, DiagramPanel },
  data() {
    return {
      show_upload: false,
      show_panels: false,
      show_home: true,
      requested_diag: '',
      shownDiagrams: [] as string[],
      diagram_types: [
        { d_type: "Arc Diagram", path: "img/vis/arc-diagram.png" },
        { d_type: "Sunburst Diagram", path: "img/vis/sunburst.png" },
        { d_type: "Distribution Diagram", path: "img/vis/distribution.png" },
        { d_type: "Adjacency Matrix", path: "img/vis/adjacency-matrix.png" },
      ],
      diagram_list: [] as DiagramInfo[],
      dataset_list: [] as DatasetInfo[],
    };
  },
  async created() {
    await this.setDiagramList();
    // Retrieve the list of datasets from
    await this.updateDatasets();
  },

  methods: {
    onNameChanged(name: string) {
      this.setDiagramList();
    },

    async selectDiagram(d_type: string) {
      // If the number of datasets is less than 1, first request upload.
      if (this.dataset_list.length < 1) {
        this.toggleUpload(true);
        this.requested_diag = d_type;
        return;
      }
      // Create a diagramID, create & add diagram to Global Storage and list of
      // shown diagrams. Finally, toggle the homepage and display the diagram panels.
      const diagramID = GlobalStorage.createID(d_type);
      await this.createDiagram(diagramID, d_type);
      await this.addToDiagramList(diagramID);
      this.toggleHome(false);
      this.toggleDiagramPanels(true);
    },

    async createDiagram(diagramID: string, diag_type: string) {

      // Obtain the default settings for the chosen diagram.
      const defaultSettings = getDefaultSettings(diag_type);

      // The most recent dataset upload is considered.
      // Add the diagram to GlobalStorage.
      await GlobalStorage.addDiagram(
        new GlobalStorage.Diagram(diagramID, this.dataset_list[this.dataset_list.length - 1].id, diag_type, defaultSettings)
      );

      // Add the diagram to list of shown diagrams.
      this.shownDiagrams.push(diagramID);

      if (this.shownDiagrams.length > 1) {
        this.createResizeEvent();
      }
    },

    async setDiagramList() {
      this.diagram_list = [];

      GlobalStorage.getDiagrams().then((diagrams) => {
        if (!diagrams) return;
        diagrams.forEach(diagramID => {
          this.addToDiagramList(diagramID);
        });
      });
    },

    async addToDiagramList(diagramID: string) {
      GlobalStorage.getDiagram(diagramID).then((diagram) => {
        if (!diagram) return;

        this.diagram_list.push({
          id: diagramID,
          name: diagram.name,
          path: this.getPNGPath(diagram.type),
          graphID: diagram.graphID
        });
      });
    },

    async diagramDeleted() {
      await this.setDiagramList();
      this.shownDiagrams = [];
    },

    createResizeEvent() {
      const diagram_panels = document.getElementsByClassName("diagram-panel");
      const resize_event = new Event("resize");
      Array.from(diagram_panels).forEach(element => {
        element.dispatchEvent(resize_event);
      });
    },

    async openDiagram(diagramID: string) {
      // Add diagram to list of shown diagrams. Finally, toggle the homepage and display the diagram panels.
      let isShown = false;

      this.shownDiagrams.forEach(shownDiagram => {
        if (shownDiagram == diagramID) {
          isShown = true;
        }
      });

      if (!isShown) {
        this.shownDiagrams.push(diagramID);
      }

      if (this.shownDiagrams.length > 1) {
        this.createResizeEvent();
      }

      this.toggleHome(false);
      this.toggleDiagramPanels(true);
    },

    getPNGPath(diagram_type: string) {
      var diagram_png_path = "";

      switch (diagram_type) {
        case "ArcDiagram":
          diagram_png_path = "img/vis/arc-diagram.png"
          break;

        case "SunburstDiagram":
          diagram_png_path = "img/vis/sunburst.png"
          break;

        case "DistributionDiagram":
          diagram_png_path = "img/vis/distribution.png"
          break;

        case "AdjacencyMatrix":
          diagram_png_path = "img/vis/adjacency-matrix.png"
          break;

        default:
          diagram_png_path = "img/vis/arc-diagram.png"
          break;
      }

      return diagram_png_path;
    },

    closeDiagram(diagramID: string) {
      // Only closes the diagram, doesn't delete from the Global Storage.
      const index = this.shownDiagrams.indexOf(diagramID);
      if (index !== -1) this.shownDiagrams.splice(index, 1);
      if (this.shownDiagrams.length < 1) {
        this.toggleHome(true);
        this.toggleDiagramPanels(false);
      } else {
        this.createResizeEvent();
      }
    },

    async datasetDeleted(id: string) {
      await this.updateDatasets();
      await this.deleteDiagramByDataset(id);
    },

    async deleteDiagramByDataset(id: string) {
      this.diagram_list.forEach(diagram => {
        if (diagram.graphID === id) {
          GlobalStorage.removeDiagramByID(diagram.id);
        }
      });
      this.diagramDeleted();
    },

    async updateDatasets() {
      this.dataset_list = [];

      GlobalStorage.getDatasets().then((datasets) => {
        if (!datasets) return;
        datasets.forEach(datasetID => {
          this.addToDatasetList(datasetID);
        });
      });

      // Force an update, otherwise Vue doesn't remove the dataset-tile.
      this.$forceUpdate();
      this.toggleUpload(false);
      // Check if any diagram was requested before upload.
      // If yes, temporarily store the name, reset the requested diagram field
      // and execute diagram creation.
      if(this.requested_diag) {
        const diag = this.requested_diag;
        this.requested_diag = '';
        await this.selectDiagram(diag);
      }
    },

    async addToDatasetList(datasetID: string) {
      GlobalStorage.getDataset(datasetID).then((dataset) => {
        if (!dataset) return;

        this.dataset_list.push({
          id: datasetID,
          name: dataset.name,
        });
      });
    },

    toggleUpload(visibility?: boolean) {
      if (visibility !== undefined) this.show_upload = visibility;
      else this.show_upload = !this.show_upload;
    },

    toggleDiagramPanels(visibility?: boolean) {
      if (visibility !== undefined) this.show_panels = visibility;
      else this.show_panels = !this.show_panels;
    },

    toggleHome(visibility?: boolean) {
      if (visibility !== undefined) this.show_home = visibility;
      else this.show_home = !this.show_home;
    },

    // brush-and-link interactivity: update GlobalStorage and each diagram if needed
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

          diagram.update("selectedNode");
        });
      }
    },
  },
});
</script>

<style lang="scss" src="@/assets/styles/visualise.scss"></style>
