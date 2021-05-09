<template>
  <background-blobs/>
  <main class="deny-access">
    <img class="deny-access__img" src="public/img/deny-access.svg" >
    <h4 class="deny-access__hint">This website is currently <br> not optimised for mobile <br> displays.</h4>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BackgroundBlobs from "@/components/BackgroundBlobs.vue";

export default defineComponent({
  name: "DenyAccess",
  components: { BackgroundBlobs },
});
</script>

<style scoped lang="scss">
@import "../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");

.deny-access {
  @include media($until: "sm") {
    .nav-bar {
      display: none;
    }

    .deny-access_img {
      display: block;
      padding: 90px 0 0 0;
      margin-left: auto;
      margin-right: auto;
    }

    .deny-access__hint {
      margin-top: 60px;
      color: white;
      text-align: center;
    }
  }
}
</style>
