<template>
  <div class="form__input">
    <label
      class="input__label"
      :class="{'input__label--optional': optional}"
      :for="title">{{ title }}</label>

    <input
      class="input__field"
      v-model="inputValueState"
      autocomplete="off"
      :type="type"
      :id="title"
      :name="title"
      :placeholder="placeholder"
      @input="onInputChange" />

    <div class="input__description" v-if="description">{{ description }}</div>

    <div class="input__slot"><slot/></div>
  </div>
</template>

<script>
export default {
  name: 'InputList',
  data () {
    return {
      inputValueState: this.$props.inputValue
    };
  },
  model: {
    prop: 'inputValue',
    event: 'inputChange'
  },
  props: {
    title: String,
    description: String,
    placeholder: String,
    inputValue: {
      type: String,
      default: ''
    },
    optional: {
      type: Boolean,
      value: false
    },
    type: {
      type: String,
      default: 'text'
    }
  },
  methods: {
    onInputChange () {
      this.$emit('inputChange', this.inputValueState);
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.form__input {
  font-family: 'Open Sans', sans-serif;
}

.input__label {
  display: block;
  font-size: 12px;
  line-height: 16px;
  margin-bottom: 8px;
  font-weight: 600;

  &::after {
    content: '*'
  }

  &--optional {
    &::after {
      content: ''
    }
  }
}

.input__field {
  width: 100%;
  margin-bottom: 6px;
  border: 1px solid $neutral--400;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  line-height: 16px;

  &:hover {
    border: 1px solid $blue--700;
  }

  &:focus {
    border: 1px solid $neutral--400;
  }
}

.input__description {
  font-size: 10px;
  line-height: 16px;
  color: $neutral--600;
}
</style>
