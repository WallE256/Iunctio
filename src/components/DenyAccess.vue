<template>
  <background-blobs />
  <main class="deny-access">
    <img
      src="img/deny-access.svg"
      alt="Unsupported aspect ratio"
      class="deny-access__img"
    />
    <h4 class="deny-access__hint">
      This website is currently not optimised for this aspect ratio.
    </h4>
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
  // Center child elements.
  @include center_item();
  flex-direction: column;
  padding: 50px;

  @include rel();

  // Occupy entire viewport height.
  height: 100%;
  &__img {
    height: 60%;
    margin-bottom: 15px;
  }

  &__hint {
    width: 75%;
    text-align: center;
    @include font-sans("Poppins", 1.1rem, "Medium", $WHITE_D);
  }
}
</style>
