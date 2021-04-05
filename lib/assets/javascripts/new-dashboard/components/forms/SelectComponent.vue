<template>
  <div class="select-wrapper">
    <select v-model="selectValue" :disabled="disabled">
      <option v-for="element in elements" :key="element.id" :value="element.id">{{element.label}}</option>
    </select>
  </div>
</template>

<script>
export default {
  name: 'InputList',
  data () {
    return {
      selectValue: this.$props.value
    };
  },
  model: {
    event: 'optionChange'
  },
  props: {
    placeholder: String,
    elements: Array,
    disabled: Boolean,
    value: null,
    type: {
      type: String,
      default: 'text'
    }
  },
  methods: {
  },
  watch: {
    selectValue () {
      this.$emit('optionChange', this.selectValue);
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.select-wrapper {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 100%;
    right: 12px;
    transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
    background-image: url('../../assets/icons/datasets/chevron.svg');
    background-repeat: no-repeat;
    background-position: center;
  }

  select {
    width: 512px;
    border: solid 1px #dddddd;
    border-radius: 4px;
    background-color: $white;
    font-size: 12px;
    color: $neutral--800;
    padding: 12px;
    height: 40px;
    -moz-appearance:none; /* Firefox */
    -webkit-appearance:none; /* Safari and Chrome */
    appearance:none;

    &::placeholder {
      color: rgba(46, 60, 67, 0.48);
    }

    &:-ms-input-placeholder {
      color: rgba(46, 60, 67, 0.48);
    }

    &::-ms-input-placeholder {
      color: rgba(46, 60, 67, 0.48);
    }
  }
}
</style>
