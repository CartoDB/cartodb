<template>
  <div class="container u-mt--64 u-mb--80">
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

// .wizard-step {
//   width: 100%;
//   height: 100%;
//   padding-top: 64px;
//   overflow-x: scroll;
// }

</style>