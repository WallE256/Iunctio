<template>
  <navigation-bar></navigation-bar>
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import NavigationBar from "@/components/NavigationBar.vue";
export default defineComponent({
  name: "App",
  components: { NavigationBar },
});
</script>
<style lang="scss" src="@/assets/styles/global.scss"></style>
