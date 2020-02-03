<template>
  <div class="BadgeWarning" :class="{'no-margin': !hasMargin }">
    <img v-if="showIcon" class="BadgeWarning__icon" src="../assets/icons/common/warning-icon.svg" width="16" height="16" />
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'BadgeWarning',
  props: {
    showIcon: {
      type: Boolean,
      default: true
    },
    hasMargin: {
      type: Boolean,
      default: true
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.BadgeWarning {
  display: flex;
  align-items: center;
  margin: 0 1em;
  padding: 0.4em 1em;
  border-radius: 30px;
  background-color: rgba($warning__bg-color, 0.2);
  font-size: 12px;

  &.no-margin {
    margin: 0;
  }

  &__icon {
    margin-right: 5px;
  }
}
</style>
