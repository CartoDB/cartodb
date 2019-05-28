<template>
  <div :class="{'container u-width--100 u-mt--64 u-mb--80': !fullWidth}" class="u-flex__grow--1">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'WizardStep',
  props: {
    fullWidth: {
      type: Boolean,
      default: false
    }
  }
};
</script>
