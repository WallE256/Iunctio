<template>
  <main class="home">
    <div class="home__container">
      <div class="brand">
        <h1 class="brand__title">Iunctio</h1>
        <h3 class="brand__subtitle">NETWORK VISUALISER</h3>
      </div>
      <div class="separator"></div>
      <nav class="nav">
        <router-link class="nav__link" :to="{ name: 'Home' }">Home</router-link>
        <router-link class="nav__link" :to="{ name: 'User Manual' }"
          >User Manual</router-link
        >
        <router-link class="nav__link" :to="{ name: 'About' }"
          >About Us</router-link
        >
      </nav>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Home",
  components: {},
});
</script>
