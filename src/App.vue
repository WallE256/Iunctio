<template>
  <navigation-bar v-show="show_item"></navigation-bar>

  <router-view v-show="show_item" v-slot="{ Component }">
    <transition name="route" mode="out-in">
      <component :is="Component"></component>
    </transition>
  </router-view>

  <deny-access v-if="!show_item" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { throttle } from "lodash";
import NavigationBar from "@/components/NavigationBar.vue";
import DenyAccess from "@/components/DenyAccess.vue";
export default defineComponent({
  name: "App",
  components: { DenyAccess, NavigationBar },
  data() {
    return {
      show_item: window.innerHeight > 576 && window.innerWidth > 576,
    };
  },
  mounted() {
    window.addEventListener(
      "resize",
      throttle(() => this.handleResize(), 250)
    );
  },
  methods: {
    handleResize() {
      this.show_item = window.innerHeight > 576 && window.innerWidth > 576;
    },
  },
});
</script>

<style lang="scss" src="@/assets/styles/global.scss"></style>

<style>
  .route-enter-active,
  .route-leave-active {
    transition-property: opacity;
    transition-timing-function: ease-in-out;
  }

  .route-enter-active {
    transition-duration: .2s;
  }

  .route-leave-active {
    transition-duration: .1s;
  }

  .route-leave-from {
    opacity: 1;
  }

  .route-leave-to {
    opacity: 0;
  }

  .route-enter-from {
    opacity: 0;
  }

  .route-enter-to {
    opacity: 1;
  }
</style>
