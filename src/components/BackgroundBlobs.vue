<template>
  <div class="blob-container">
    <svg
      id="blob-green"
      viewBox="0 0 117.27 98.15"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M115.66,25.56c6.6,17.8-7.8,45-29.1,59.8s-49.6,17.3-67,4.6-24-40.2-16.5-59.3S32.16,1.06,56.76.06,109.06,7.66,115.66,25.56Z"
      />
    </svg>
    <svg id="blob-red" viewBox="0 0 930 903" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M676.267 40.2969C800.64 96.265 877.596 186.436 907.135 310.809C936.674 435.182 937.062 559.944 908.301 685.095C879.54 810.246 802.584 880.594 677.433 896.141C552.282 911.688 438.792 900.028 336.961 861.161C235.13 822.294 144.96 751.946 66.449 650.115C-12.0617 548.284 -21.001 437.514 39.631 317.805C100.263 198.096 190.434 107.925 310.143 47.293C429.852 -13.3391 551.894 -15.6711 676.267 40.2969Z"
      />
    </svg>
    <svg
      id="blob-blue"
      viewBox="0 0 388 399"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M369.857 289.994C345.857 343.328 307.19 376.328 253.857 388.994C200.524 401.661 147.024 401.828 93.3571 389.494C39.6905 377.161 9.52381 344.161 2.85714 290.494C-3.80952 236.828 1.19048 188.161 17.8571 144.494C34.5238 100.828 64.6905 62.1611 108.357 28.4944C152.024 -5.17225 199.524 -9.00559 250.857 16.9944C302.19 42.9944 340.857 81.6611 366.857 132.994C392.857 184.328 393.857 236.661 369.857 289.994Z"
      />
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "BackgroundBlobs",
});
</script>

<style scoped lang="scss">
@import "../assets/styles/_config.scss";

.blob-container {
  // Prevent overflow of blobs from affecting scrolling.
  overflow: hidden;
  // Remove from DOM flow to not compete for space with siblings.
  position: absolute;
  @include setSize(100%, 100%);

  #blob-green {
    @include abs(0 0 -300px -200px);
    width: 750px;
    fill: #677c60;
    animation: spin 120s linear infinite;
  }

  #blob-red {
    @include abs(-400px -300px 0 0);
    width: 930px;
    fill: #d4786c;
    animation: spin 135s linear infinite reverse;
  }

  #blob-blue {
    @include abs(-100px -50px 0 0);
    width: 350px;
    fill: #8ab6d6;
    animation: spin 100s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}
</style>
