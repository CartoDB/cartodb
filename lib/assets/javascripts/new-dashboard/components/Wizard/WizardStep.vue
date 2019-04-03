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

</style>
