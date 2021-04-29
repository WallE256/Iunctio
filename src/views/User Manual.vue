<template>
  <h1>User Manual</h1>
  <nav class="nav">
    <router-link class="nav__link" :to="{ name: 'Home' }">Home</router-link> |
    <router-link class="nav__link" :to="{ name: 'User Manual' }"
    >User Manual</router-link
    > |
    <router-link class="nav__link" :to="{ name: 'About' }"
    >About Us</router-link
    >
  </nav>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "User Manual",
  components: {},
});
</script>

<style scoped></style>
