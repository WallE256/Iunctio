<template>
  <div class="legend">
    <div class="toggleLegend" title="Toggle Legend" @click="showLegend=!showLegend">
      <svg class="toggleLegend__icon" viewBox="0 0 128 90"><path d="M92,8.2h31v31H92Z" fill="#12E2A3"/><rect x="4.99" y="18.09" width="58.29" height="11.21" rx="1.5" fill="#f8f8f8"/><rect x="4.99" y="60.7" width="72.86" height="11.21" rx="1.5" fill="#f8f8f8"/><path d="M92,50.81h31v31H92Z" fill="#f49d6a"/></svg>
    </div>
    <transition name="slide-fade">
      <div class="panel" v-show="showLegend">
        <h1 class="panel__title"> Legend </h1>
        <span class="hide-panel" @click="showLegend=false"></span>
        <div class="panel__entries">
          <div class="panel__entry" v-for="entry in Object.fromEntries(colorScheme)" :key="entry.id">
            <p class="entry__title"> {{entry.title}} </p>
            <span class="entry__color" :style="{background: entry.assignedColor}"></span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "ColorLegend",
  data() {
    return {
      showLegend: false,
    }
  },
  props: {
    colorScheme: {required: true}
  },
})

</script>

<style lang="scss" scoped>
@import "../../assets/styles/_config.scss";
@include font-face("Poppins", "Medium");


.toggleLegend {
  @include abs(0 0 10px 10px);
  $BTN_SIZE: 40px;
  @include setSize($BTN_SIZE);
  background: $BLUE_D;
  border-radius: $BTN_SIZE/2;
  @include center_item();
  cursor: pointer;

  &__icon {
    width: 60%;
  }

}

.panel {
  @include abs(0 0 10px 10px);
  box-shadow: 0 0 5px rgba($BLUE_D, 0.2);
  border-radius: 5px;
  background: darken($WHITE_D, 5%);

  &__title {
    margin: 10px;
    }

  &__entries {
    min-width: 175px;
    max-height: 250px;
    overflow-y: auto;
    padding: 0px 10px 10px 10px;
    }

  &__entry {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;
    .entry__title{
      @include font-sans("Poppins", 0.8rem, "Medium", $BLACK_DD);
    }
    .entry__color {
      @include setSize(15px);
      display: inline-block;
      background: $BLACK_DD;
      margin-left: 5px;
    }

  }

  .hide-panel {
    // Make the button circular.
    border-radius: 100%;
    @include setSize(25px);
    cursor: pointer;
    @include abs(10px 10px 0 0);

    &::after,
    &::before {
      @include pseudo($height: 75%, $width: 3px);
      top: 50%;
      left: 50%;
      background: $GREY;
      @include transition(background transform, 0.3s, $ease1);
    }

    &::after {
      transform: translate(-50%, -50%) rotateZ(-45deg);
    }

    &::before {
      transform: translate(-50%, -50%) rotateZ(45deg);
    }

    &:hover.hide-panel::after {
      background: $RED;
      transform: translate(-50%, -50%) rotateZ(-45deg) scale(1.1);
    }

    &:hover.hide-panel::before {
      background: $RED;
      transform: translate(-50%, -50%) rotateZ(45deg) scale(1.1);
    }
  }

}

.slide-fade {
  &-enter-active,
  &-leave-active {
    @include transition(opacity transform, 0.2s, $ease1);
  }

  &-enter-from,
  &-leave-to {
    transform: translateY(50%);
    opacity: 0;
  }
}


</style>
