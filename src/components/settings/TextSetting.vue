<template>
    <label CLASS="text-input" :for="settingid">
      <span class="text-input__label">{{ settinglabel }}</span>
      <input class="text-input__input" type="text" :name="settingid" v-on:change="onChange" :value="value" placeholder="Placeholder Text" />
    </label>
</template>

<style scoped lang="scss">
@import "../../assets/styles/config";
.text-input {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 10px 0;

  &__label {
    margin: 0 15px 0 5px;
  }

  &__input {
    appearance: none;
    background: $GREY_L;
    border: 0;
    @include font-sans("Poppins", 0.75rem, "Regular", inherit);
    padding: 0.5rem;
    box-shadow: 1px 1px 2px rgba($BLACK_DDD, 0.2);
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
    value: {
      type: String,
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
      // onchange will only fire if the user presses enter or changes focus to
      // another element, so this doesn't actually fire after every key
      const target = event.target as HTMLInputElement;
      this.$emit("setting-changed", this.$props.settingid, target.value);
    },
  },
});
</script>
