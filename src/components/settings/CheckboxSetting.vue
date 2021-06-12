<template>
  <label class="switch" :for="settingid">
    <span class="switch__label">{{ settinglabel }}</span>
    <input
      class="switch__input"
      type="checkbox"
      :name="settingid"
      v-on:change="onChange"
      :checked="value"
    />
  </label>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    settingid: {
      type: String,
      required: true,
    },
    settinglabel: {
      type: String,
      required: true,
    },
    value: {
      type: Boolean,
      required: true,
    },
  },

  methods: {
    onChange(event: Event) {
      const target = event.target as HTMLInputElement;
      this.$emit("setting-changed", this.$props.settingid, target.checked);
    },
  },
});
</script>

<style scoped lang="scss">
@import "../../assets/styles/config";
$toggleWidth: 40px;
$toggleHeight: $toggleWidth/2;

.switch {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 10px 0;

  &__label {
    margin: 0 15px 0 5px;
  }
  &__input {
    appearance: none;
    @include setSize($toggleWidth, $toggleHeight);
    display: inline-block;
    background: $GREY_L;
    border-radius: $toggleWidth;
    @include rel();
    cursor: pointer;
    @include transition(background, 0.25s, $ease1);
    box-shadow: 1px 1px 2px rgba($BLACK_DDD, 0.2);
    margin-left: auto;
    margin-right: 0;

    &::after {
      @include pseudo($height: $toggleHeight, $width: $toggleHeight);
      transform: scale(1.1);
      background: $BLUE_D;
      box-shadow: 0 0 1px rgba($BLACK_DDD, 30%);
      border-radius: 50%;
      @include transition(transform, 0.25s, $ease1);
    }
  }

  &__input:checked {
    background: $AQUAMARINE;
    &::after {
      transform: scale(1.1) translateX($toggleWidth/2);
    }
  }
}
</style>
