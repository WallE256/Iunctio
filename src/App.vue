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
    transition-property: opacity, transform;
    transition-timing-function: ease-in-out;
  }

  .route-enter-active {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    transform: translate3d(0, 100vh, 0);
     transition-duration: .8s;
  }

  .route-leave-active {
    transition-duration: .4s;
  }

  .route-leave-to {
    opacity: 0.2;
    transform: translate3d(0, 0, 0);
  }

  .route-enter-to {
    transform: translate3d(0, 0, 0);
  }
</style>
