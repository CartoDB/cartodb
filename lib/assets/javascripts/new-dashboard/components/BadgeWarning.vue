<template>
  <div class="BadgeWarning">
    <img class="BadgeWarning__icon" src="../assets/icons/common/warning-icon.svg" width="16" height="16" />
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'BadgeWarning'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.BadgeWarning {
  display: flex;
  align-items: center;
  margin: 0 1em;
  padding: .4em 1em;
  border-radius: 30px;
  background-color: rgba($warning__bg-color, 0.2);
  font-size: 12px;

  &__icon {
    margin-right: 5px;
  }
}
</style>
