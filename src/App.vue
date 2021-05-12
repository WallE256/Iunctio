<template>
  <navigation-bar v-show="show_item"></navigation-bar>
  <router-view v-show="show_item" />
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
