<template>
  <div class="wizard-step container">
    <h1 class="title is-body is-semibold">{{title}}</h1>
    <h2 class="text is-caption">{{subTitle}}</h2>
    <div>
      <slot></slot>
    </div>
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

.wizard-step {
  width: 100%;
}

</style>