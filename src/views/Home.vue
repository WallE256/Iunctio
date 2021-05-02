<template>
  <main class="home">
    <background-blobs />
    <div class="home_container">
      <div class="brand">
        <h1 class="brand__title">iunctio</h1>
        <h3 class="brand__subtitle">NETWORK VISUALISER</h3>
      </div>
      <router-link class="cta-visualise" :to="{ name: 'Visualise' }"
        >VISUALISE</router-link
      >
      <a href="" class="cta-tour">...or take a tour?</a>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BackgroundBlobs from "@/components/BackgroundBlobs.vue";

export default defineComponent({
  name: "Home",
  components: { BackgroundBlobs },
});
</script>

<style lang="scss" src="@/assets/styles/home.scss"></style>
