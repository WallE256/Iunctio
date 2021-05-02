<template>
  <nav class="nav-bar">
    <h3 class="nav-bar__title">iunctio</h3>
    <div class="nav-bar__links">
      <router-link
        class="nav-bar__link"
        v-for="route in routes"
        :key="route.path"
        :to="route.path"
      >
        {{ route.name }}
      </router-link>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Navigation Bar",
  computed: {
    routes() {
      return this.$router.options.routes;
    },
  },
});
</script>

<style scoped lang="scss">
@import "../assets/styles/_config.scss";

@include font-face("Prata", "Regular");
@include font-face("Poppins", "Medium");

.nav-bar {
  // Fix the navigation bar to the top.
  @include fix(f0 0 0 0);
  width: 100%;
  height: 50px;
  z-index: ind("nav-bar");
  // Position the nav-links in the center.
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  // Create a glass-morphic effect on the navbar.
  background: $CREAM;
  background: linear-gradient(
    to bottom right,
    rgba($CREAM, 0.7),
    rgba($CREAM, 0.3)
  );
  backdrop-filter: blur(20px);

  &__title {
    position: absolute;
    left: 20px;
    @include font-serif("Prata", 1.3rem, "Regular", $WHITE);
  }

  &__links {
    @include font-sans("Poppins", 1rem, "Medium", $WHITE);
    width: 33.33%;
    min-width: 400px;
    max-width: 600px;

    // Space nav-links evenly.
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-evenly;
    white-space: nowrap;
  }

  &__link {
    // Position the underlines relative to the parent.
    position: relative;
    @include transition(color, 0.3s, $ease1);
    &:focus {
      // Remove default outline on focus.
      outline: none;
      // Compensate by altering colour.
      color: $BLACK_DDD;
    }

    &::after {
      @include pseudo($width: 100%, $height: 2px);
      background-color: $BLACK_DDD;

      // Initially underline must be hidden.
      transform: scaleX(0);
      // Animate the transform from center.
      transform-origin: center;
      @include transition(transform, 0.35s, $ease1);
    }

    &:hover::after,
    &:focus::after {
      // On hover/focus underline the link.
      transform: scale(1);
    }

    &.router-link-exact-active::after {
      transform: scale(1);
    }
  }
}
</style>
