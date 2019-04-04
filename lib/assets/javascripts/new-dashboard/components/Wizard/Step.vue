<template>
  <div :class="{'container u-width--100 u-mt--64 u-mb--80 u-p--0': !fullWidth}" class="u-flex__grow--1">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'WizardStep',
  props: {
    title: String,
    subTitle: String,
    fullWidth: {
      type: Boolean,
      default: false
    }
  }
};
</script>
