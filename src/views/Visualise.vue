<template>
  <main class="visualise">
    <create-visualisations v-show="show_vis_home" @tile-click="toggleHome" />
    <keep-alive
      ><upload-dataset v-show="!show_vis_home" @back="toggleHome"
    /></keep-alive>
    <current-visualisations v-show="show_vis_home" />
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CreateVisualisations from "@/components/visualise/CreateVisualisations.vue";
import UploadDataset from "@/components/visualise/UploadDataset.vue";
import CurrentVisualisations from "@/components/visualise/CurrentVisualisations.vue";

export default defineComponent({
  name: "Visualise",
  components: { UploadDataset, CurrentVisualisations, CreateVisualisations },
  data() {
    return {
      show_vis_home: true,
      selected_vis: null as { name: string; icon: string } | null,
    };
  },
  methods: {
    toggleHome() {
      this.show_vis_home = !this.show_vis_home;
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
}
</style>
