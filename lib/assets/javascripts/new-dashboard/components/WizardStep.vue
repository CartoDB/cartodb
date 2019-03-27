<template>
  <div class="wizard-step">
    <h2>{{title}}</h2>
    <h2>{{subTitle}}</h2>
     <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'WizardStep',
  props: {
    title: String,
    subTitle: String,
  },
}
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

</style>