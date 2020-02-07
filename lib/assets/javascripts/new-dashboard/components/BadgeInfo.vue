<template>
  <div class="BadgeWarning">
    <img class="BadgeWarning__icon" src="../assets/icons/common/info-icon.svg" width="16" height="16" />
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'BadgeInfo'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.BadgeWarning {
  display: flex;
  align-items: center;
  padding: 0.4em 1em;
  border-radius: 30px;
  background-color: rgba($info__bg-color, 0.12);
  font-size: 12px;

  &__icon {
    margin-right: 5px;
  }
}
</style>
