<template>
  <label class="select">
    <span class="select__label">{{ settinglabel }}</span>
    <div class="select__container">
      <select :name="settingid" v-on:change="onChange" class="select__input">
        <option
          v-for="option in options"
          :key="option"
          :selected="option === value"
        >
          {{ option }}
        </option>
      </select>
    </div>
  </label>
</template>

<style scoped lang="scss">
@import "../../assets/styles/config";
.select {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 10px 0;

  &__label {
    margin: 0 15px 0 5px;
  }

  &__container {
    position: relative;
    margin-left: auto;
    margin-right: 0;

    .select__input {
      appearance: none;
      background: $GREY_L;
      @include font-sans("Poppins", 0.75rem, "Medium", $BLACK_DDD);
      border: 0;
      padding: 0.5rem 4rem 0.5rem 2rem;
      box-shadow: 1px 1px 2px rgba($BLACK_DDD, 0.2);
      width: 190px;
    }

    &::after {
      @include pseudo();
      $tri-size: 8px;
      border-style: solid;
      border-width: $tri-size $tri-size 0 $tri-size;
      border-color: $BLUE_D transparent transparent transparent;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
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
    options: {
      type: Array,
      required: true,
    },
    value: {
      type: String,
      default: "",
    },
  },

  data() {
    return {
      timeout: null as number | null,
    };
  },

  methods: {
    onChange(event: Event) {
      const target = event.target as HTMLSelectElement;
      this.$emit("setting-changed", this.$props.settingid, target.value);
    },
  },
});
</script>
