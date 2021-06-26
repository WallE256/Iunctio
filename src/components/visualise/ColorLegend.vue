<template>
  <button @click="showLegend=!showLegend">Legend</button>
  <div v-if="showLegend">
    <div v-for="entry in colorScheme" :key="entry[0]">
      <h1>{{entry[0]}} {{entry[1].assignedColor}}</h1>
      
    </div>
  </div>
  
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "ColorLegend",
  props: ['colorScheme'],
  data() {
    return {
      showLegend: false
    }
  },

  
})

</script>

<style>
  h1 {
    color: red;
  }
</style>