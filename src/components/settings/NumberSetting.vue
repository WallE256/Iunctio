<template>
    <label :for="settingid" class="num">
      <span class="num__label"> {{settinglabel}} </span>
      <div class="num__container">
        <button class="input__decrease" onclick="this.nextElementSibling.stepDown();" @click="onChange"></button>
        <input
          id="number-input"
          ref="number-input"
          type="number"
          :name="settingid"
          v-on:change="onChange"
          :min="min"
          :max="max"
          :value="value"
          class="num__input"
        />
        <button class="input__increase" onclick="this.previousElementSibling.stepUp();" @click="onChange"></button>
      </div>
    </label>
</template>

<style lang="scss" scoped>
@import "../../assets/styles/config";
.num{
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 10px 0;

  &__label {
    margin: 0 15px 0 0px;
  }

  &__container{
    @include rel();
    margin-left: auto;
    margin-right: 0;

    .num__input {
      -webkit-appearance: textfield;
      -moz-appearance: textfield;
      appearance: textfield;
      background: $GREY_L;
      @include font-sans("Poppins", 0.75rem, "Medium", $BLACK_DDD);
      border: 0;
      padding: 0.5rem 2rem;
      box-shadow: 1px 1px 2px rgba($BLACK_DDD, 0.2);
      text-align: center;
      border-radius: 2rem;
      max-width: 200px;

      // Hide default spin-arrows.
      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button {
        appearance: none;
      }
    }

    $arrow-size: 10px;

    button.input__decrease{
      appearance: none;
      @include abs(50% 0 0 0.75rem);
      display: block;
      @include setSize($arrow-size);
      border-style: solid;
      border-width: 3px 0 0 3px;
      border-color: $BLUE_D transparent transparent $BLUE_D;
      transform: translateY(-50%) rotate(-45deg);
      background-color: transparent;
      cursor: pointer;
    }

    button.input__increase{
      appearance: none;
      @include abs(50% 0.75rem 0 0);
      display: block;
      @include setSize($arrow-size);
      border-style: solid;
      border-width: 3px 3px 0 0;
      border-color: $BLUE_D $BLUE_D transparent transparent;
      transform: translateY(-50%) rotate(45deg);
      background-color: transparent;
      cursor: pointer;
    }
  }


}
</style>


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
    min: {
      type: Number,
      default: () => 0,
    },
    max: {
      type: Number,
      default: () => 10000000,
    },
    value: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      timeout: null as number | null,
    };
  },

  methods: {
    onChange(event: Event) {
      const target = this.$refs["number-input"] as HTMLInputElement;
      const number = parseFloat(target.value);
      if (!isNaN(number) && number >= this.min && number <= this.max) {
        this.$emit("setting-changed", this.$props.settingid, number);
      }
    },
  },
});
</script>
