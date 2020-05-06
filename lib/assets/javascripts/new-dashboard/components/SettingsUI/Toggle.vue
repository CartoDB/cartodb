<template>
  <section class="toggle" :class="{ 'toggle--disabled': disabled }">
    <div class="toggle__field">
      <input
        id="toggle"
        type="checkbox"
        value="false"
        :name="name"
        v-model="checkboxValueState"
        @change="onCheckboxChange">

      <label for="toggle"></label>
    </div>
    <label class="toggle__label" for="toggle">{{ label }}</label>
  </section>
</template>

<script>
export default {
  name: 'Toggle',

  model: {
    prop: 'checkboxValue',
    event: 'checkboxChange'
  },

  data () {
    return {
      checkboxValueState: this.$props.checkboxValue
    };
  },

  props: {
    label: String,
    name: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    onCheckboxChange () {
      this.$emit('checkboxChange', this.checkboxValueState);
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

$sWidth: 36px;
$sHeight: 20px;

.toggle{
  &.toggle--disabled {
    opacity: 0.4;
    pointer-events: none;
  }
}

.toggle__field {
  display: inline-block;
  position: relative;
  width: $sWidth;
  height: $sHeight;
}

.toggle__field input {
  visibility: hidden;
}

.toggle__field label {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: $sWidth;
  height: $sHeight;
  transition: all 150ms ease;
  border-radius: 30px;
  background-color: #DDD;
  cursor: pointer;
}

.toggle__field label::before {
  content: ' ';
  display: block;
  position: absolute;
  top: 4px;
  left: 4px;
  width: 12px;
  height: 12px;
  transition: all 150ms ease;
  border-radius: 30px;
  background-color: #FFF;
}

.toggle__field input:checked + label::before {
  left: 20px;
}

.toggle__field input:checked + label {
  background-color: #73C86B;
}

.toggle__label {
  font-size: 12px;
  margin-left: 10px;
}
</style>
