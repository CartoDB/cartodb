<template>
  <div class="SectionTitleWarning">
    <img class="SectionTitleWarning__icon" src="../assets/icons/common/warning-icon.svg" width="16" height="16" />
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'SectionTitleWarning'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.SectionTitleWarning {
  display: flex;
  align-items: center;
  padding: .4em 1em;
  border-radius: 30px;
  background-color: rgba($warning__bg-color, 0.2);
  font-size: 12px;

  &__icon {
    margin-right: 5px;
  }
}
</style>
