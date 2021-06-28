<template>
  <main class="home">

    <transition appear name="fade">
      <background-blobs />
    </transition>

    <div class="home_container">
      <div class="brand">

        <transition appear name="bounce">
          <h1 class="brand__title">iunctio</h1>
        </transition>

        <transition appear name="fade">
          <h3 class="brand__subtitle">NETWORK VISUALISER</h3>
        </transition>

      </div>
      <transition appear name="slide">
        <router-link class="cta-visualise" :to="{ name: 'Visualise' }"
          >VISUALISE
        </router-link>
      </transition>
      <transition appear name="slide">
        <router-link class="cta-tour" :to="{ name: 'About' }"
          >...or explore our journey?
        </router-link>
      </transition>

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

<style>
  .slide-enter-active {
    animation: coming .7s ease-out;
    animation-delay: .75s;
    opacity: 0;
  }

  @keyframes coming {
    0% {
      transform: translateX(-75%);
      opacity: 0;
    }
    50% {
      opacity: .4;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .bounce-enter-active{
    animation: bounce-in .4s ease-in;
    animation-delay: 0s;
    opacity: 0;
  }

  @keyframes bounce-in {
    0% {
      transform: scale(0);
    }

    65% {
      transform: scale(1.1);
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .fade-enter-active {
    animation: fadeIn 1s ease-in-out;
    animation-delay: 0.25s;
    opacity: 0;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
