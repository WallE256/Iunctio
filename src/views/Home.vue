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

        <transition appear name="slide">
          <h3 class="brand__subtitle">NETWORK VISUALISER</h3>
        </transition>  

      </div>
      <router-link class="cta-visualise" :to="{ name: 'Visualise' }"
        >VISUALISE</router-link
      >
      <router-link class="cta-tour" :to="{ name: 'About' }"
        >...or explore our journey?</router-link
      >
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
    animation: coming 1s;
    animation-delay: 2.175s;
    opacity: 0;
  }

  @keyframes coming {
    from {
      transform: translateX(-100%);
      opacity: 0; 
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .bounce-enter-active{
    animation: bounce-in .7s ease-in;
    animation-delay: 1.3s;
    opacity: 0;
  }

  @keyframes bounce-in {
    0% {
      transform: scale(0);
    }

    50% {
      transform: scale(1.2);
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .fade-enter-active {
    animation: fadeIn .4s ease-in;
    animation-delay: 1s;
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
