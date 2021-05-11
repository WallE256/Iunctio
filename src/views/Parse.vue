<template>
  <div class="parse">
    <main style="padding-top: 55px">
      <h1>This is pppaaarse</h1>
      <input type="file" @change="previewFiles" />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { parser } from "@/parser/parser";

export default defineComponent({
  methods: {
    previewFiles(event: { target: { files: File[] } }) {
      parser(event.target.files[0]);
    },
  },
});
</script>
