<template>
  <div class="diagram-panel">
    <component :is="componentName" :diagramid="diagram_id" />
    <transition name="slide-fade">
      <div class="diagram-panel__settings" v-if="showSettings">
        <diagram-settings :diagramid="diagram_id" @setting-changed="onSettingChanged" />
      </div>
    </transition>
    <span class="settings-icon" @click="toggleSettings" title="Diagram Settings">
      <svg class="icon-gear" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path d="M509.931 223.915c-3.349-25.835-30.251-43.52-56-33.877-9.643 3.648-21.248-1.771-25.6-11.499a189.583 189.583 0 00-19.008-33.045c-6.613-9.195-5.355-21.227 2.859-28.011 9.813-8.064 15.296-19.989 15.04-32.683-.256-12.907-6.336-24.789-16.683-32.64-17.024-12.885-35.584-23.616-55.189-31.872-5.291-2.219-10.837-3.349-16.491-3.349-20.437 0-37.675 14.528-41.003 34.539-1.749 10.517-11.712 17.664-22.933 16.448a181.135 181.135 0 00-37.867 0c-11.179 1.216-21.184-5.931-22.933-16.448-3.328-20.011-20.565-34.539-41.003-34.539-5.653 0-11.2 1.131-16.469 3.349A255.192 255.192 0 00101.44 52.16c-10.325 7.851-16.405 19.733-16.661 32.619-.256 12.715 5.227 24.619 15.04 32.725 8.235 6.763 9.451 18.795 2.859 27.968a189.687 189.687 0 00-19.029 33.045c-4.352 9.728-15.104 15.445-25.835 11.413-4.693-1.749-9.579-2.645-14.528-2.645-20.821 0-38.528 15.744-41.237 36.629A255.675 255.675 0 000 256c0 10.688.704 21.504 2.069 32.085 3.328 25.813 30.208 43.499 56 33.877 9.621-3.648 21.248 1.771 25.6 11.499a189.583 189.583 0 0019.008 33.045c6.613 9.195 5.355 21.227-2.859 28.011-9.813 8.064-15.296 19.989-15.04 32.683.256 12.907 6.336 24.789 16.683 32.64 17.024 12.885 35.584 23.616 55.189 31.872 5.291 2.219 10.837 3.349 16.491 3.349 20.437 0 37.675-14.528 41.003-34.539 1.749-10.517 11.733-17.557 22.933-16.448a181.135 181.135 0 0037.867 0c11.221-1.131 21.184 5.931 22.933 16.448 3.328 20.011 20.565 34.517 41.003 34.539 5.653 0 11.2-1.131 16.469-3.349a255.04 255.04 0 0055.189-31.872c10.325-7.851 16.427-19.733 16.683-32.619.256-12.715-5.227-24.619-15.04-32.725-8.235-6.763-9.451-18.795-2.859-27.968a189.687 189.687 0 0019.029-33.045c4.352-9.749 15.125-15.445 25.835-11.413a41.006 41.006 0 0014.528 2.667c20.821 0 38.528-15.744 41.237-36.629C511.296 277.397 512 266.624 512 256c0-10.624-.704-21.397-2.069-32.085zM256 341.333c-47.061 0-85.333-38.272-85.333-85.333s38.272-85.333 85.333-85.333 85.333 38.272 85.333 85.333-38.272 85.333-85.333 85.333z"/>
      </svg>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ArcDiagram from "@/components/vis-type/ArcDiagram.vue";
import SunburstDiagram from "@/components/vis-type/SunburstDiagram.vue";
import DistributionDiagram from "@/components/vis-type/DistributionDiagram.vue";
import DiagramSettings from "@/components/DiagramSettings.vue";
import * as GlobalStorage from "@/scripts/globalstorage";

export default defineComponent({
  name: "DiagramPanel",

  components: { DiagramSettings, ArcDiagram, SunburstDiagram, DistributionDiagram },

  props: {
    diagram_id: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      componentName: "",
      showSettings: false
    };
  },

  async created() {
    const diagram = await GlobalStorage.getDiagram(this.diagram_id);
    if (!diagram) {
      console.warn("Non-existent diagram", this.diagram_id);
      return;
    }
    this.componentName = diagram.type;
  },

  mounted() {
    console.log(this.componentName);
  },

  methods: {
    async onSettingChanged(id: string, value: any) {
      const diagram = await GlobalStorage.getDiagram(this.diagram_id);
      if (!diagram) {
        console.warn("Non-existent diagram:", this.diagram_id);
        return;
      }
      GlobalStorage.changeSetting(diagram, id, value);
    },

    toggleSettings() {
      this.showSettings = !this.showSettings;
    }

  },
});
</script>

<style lang="scss" scoped>
@import "../../assets/styles/_config.scss";

.diagram-panel {
  @include setSize(100%, 100%);
  background-color: $WHITE;
  border-radius: 5px;
  margin: 0px 3px;
  box-shadow: 2px 2px 4px rgba($BLACK_DDD, 0.25);
  padding: 5px;
  position: relative;
  overflow: hidden;
  @include font-face("Poppins", "Regular");
  @include font-sans("Poppins", 0.75rem, "Regular", $BLACK_DDD);

  &__settings {
    background-color: darken($WHITE_D, 5%);
    border-radius: 5px;
    box-shadow: 0 0 5px rgba($BLUE_D, 0.2);
    padding: 10px;
    @include abs(0 10px 10px 0);
  }

  .settings-icon {
    display: block;
    @include setSize(25px);
    border-radius: 100%;
    @include abs(0 0 10px 10px);
    cursor: pointer;
    .icon-gear {
      fill: $BLUE_D;
      @include transition(transform, 0.2s, $ease1);

      &:hover {
        transform: rotateZ(30deg);
      }
    }
  }
}

.slide-fade {
  &-enter-active, &-leave-active {
    @include transition(opacity transform, 0.2s, $ease1);
  }

  &-enter-from, &-leave-to {
    transform: translateY(50%);
    opacity: 0;
  }
}
</style>