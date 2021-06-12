<template>
  <div class="create-vis">
    <h3 class="create-vis__title">Create a new visualisation.</h3>
    <div class="create-vis__tiles">
      <!--Loop through all the vis-types and display a tile for each.-->
      <new-vis
        v-for="vis in vis_types"
        :key="vis.name"
        :vis_type="vis"
        @tile-click="onTileClick"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import NewVis from "@/components/visualise/NewVis.vue";
import ArcDiagram from "@/components/visualise/vis-type/ArcDiagram.vue";
import SunburstDiagram from "@/components/visualise/vis-type/SunburstDiagram.vue";
import DistributionDiagram from "@/components/visualise/vis-type/DistributionDiagram.vue";
export default defineComponent({
  name: "CreateVisualisations",
  components: { NewVis },
  data() {
    return {
      vis_types: [ArcDiagram, SunburstDiagram, DistributionDiagram],
    };
  },
  methods: {
    onTileClick(component: any) {
      this.$emit("tile-click", component);
    },
  },
});
</script>

<style scoped lang="scss">
@import "../../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");
.create-vis {
  padding: 0 40px;
  &__title {
    @include font-sans("Poppins", 1.25rem, "Medium", $BLACK_DDD);
  }
  &__tiles {
    display: flex;
    flex-flow: row wrap;
  }
}
</style>
