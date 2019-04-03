<template>
  <div class="container u-flex__grow--1 u-mt--64 u-mb--80 u-p--0">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'WizardStep',
  props: {
    title: String,
    subTitle: String,
  }
}
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.container {
  width: 100%;
}

</style>
