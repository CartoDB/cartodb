<template>
  <h2 class="title is-body u-mb--24 u-flex u-flex__align--center">
    <span class="icon icon--large">
      <slot name="icon"></slot>
    </span>

    {{title}}
  </h2>
</template>

<script>
export default {
  name: 'StepTitle',
  props: {
    title: String
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-right: 16px;
  margin-left: -40px;
}

.icon--large {
  width: 24px;
  height: 24px;
}
</style>
