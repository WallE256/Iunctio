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
            <h3 class="upload-dataset__title">Upload a new dataset.</h3>
            <button class="upload-dataset__btn" @click="requestUpload" />
            <div class="upload-dataset__tiles"></div>
        </section>
        <section class="create-diagram">
            <h3 class="create-diagram__tiles">Create a new diagram.</h3>
            <div class="create-diagram__tiles">
                <create-diagram-tile
                    v-for="diag in diagrams"
                    :key="diag.name"
                    :name="diag.name"
                    :path="diag.path"
                    @tile-click="createDiagram"
                />
            </div>
        </section>
        <section>
            <div class="visualise__panels" v-show="show_panels">
                <diagram-panel
                    v-for="diagram in shownDiagrams"
                    :key="diagram"
                    :diagram_id="diagram"
                    @selected-node-change="onSelectedNodeChange"
                />
            </div>
        </section>
    </main>
</template>

<script lang="ts">
import { defineComponent, DefineComponent } from "vue";
import CreateDiagramTile from "@/components/visualise/CreateDiagramTile.vue";
import * as GlobalStorage from "@/scripts/globalstorage";
// import UploadDataset from "@/components/visualise/UploadDataset.vue";
// import DiagramPanel from "@/components/visualise/DiagramPanel.vue";
// import CurrentVisualisations from "@/components/visualise/CurrentVisualisations.vue";

export default defineComponent({
    name: "Visualise",
    components: { CreateDiagramTile },
    data() {
        return {
            show_vis_home: true,
            show_upload: false,
            show_panels: false,
            selectedDiagram: null as DefineComponent | null,
            shownDiagrams: [] as string[],
            diagrams: [
                { name: "Arc Diagram", path: "img/vis/arc-diagram.png" },
                { name: "SunBurst Diagram", path: "img/vis/sunburst.png" },
            ],
        };
    },
    methods: {
        createDiagram() {
            console.log("Diagram Created.");
        },
        toggleHome(visibility?: boolean) {
            if (!(visibility === undefined)) {
                this.show_vis_home = visibility;
            } else {
                this.show_vis_home = !this.show_vis_home;
            }
        },
        toggleUpload(visibility?: boolean) {
            if (!(visibility === undefined)) {
                this.show_upload = visibility;
            } else {
                this.show_upload = !this.show_vis_home;
            }
        },
        togglePanels(visibility?: boolean) {
            if (!(visibility === undefined)) {
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
        async onSelectedNodeChange(
            datasetID: string,
            nodeID: string,
            append: boolean
        ) {
            const nodes = GlobalStorage.selectedNodes;

            // remove it if already present, add it if not present yet (so toggle)
            let present = false;
            for (let i = 0; i < nodes.length; i++) {
                if (
                    nodes[i].datasetID === datasetID &&
                    nodes[i].nodeID === nodeID
                ) {
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
                GlobalStorage.getDiagram(this.shownDiagrams[i]).then(
                    (diagram) => {
                        if (!diagram) return;
                        if (diagram.graphID !== datasetID) return;

                        if (diagram.onChange) {
                            diagram.onChange(diagram, "selectedNode");
                        }
                    }
                );
            }
        },
    },
});
</script>

<style scoped lang="scss">
@import "../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");

.visualise {
    // Occupy entire viewport height.
    height: 100%;
    // Prevent content under nav-bar
    padding: 50px 25px 25px 25px;
    position: relative;

    .create-diagram {
        padding: 0 40px;
        &__title {
            @include font-sans("Poppins", 1.25rem, "Medium", $BLACK_DDD);
        }

        &__tiles {
            display: flex;
            flex-flow: row wrap;
        }
    }

    // Panels containing the diagrams to be displayed side-by-side.
    &__panels {
        display: flex;
        flex-direction: row;
        height: 100%;
    }

    // Back button
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
