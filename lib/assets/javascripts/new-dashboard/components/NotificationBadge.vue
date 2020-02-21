<template>
  <div class="NotificationBadge" :class="[hasMargin ? `NotificationBadge--${type}` : `NotificationBadge--${type} no-margin`]">
      <div v-if="showIcon" class="NotificationBadge__icon"></div>
      <slot></slot>
    </div>
</template>

<script>
export default {
  name: 'NotificationBadge',
  props: {
    type: {
      type: String,
      default: 'info'
    },
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

.NotificationBadge {
  display: inline-flex;
  align-items: center;
  margin: 0 1em;
  padding: 0.4em 1em;
  border-radius: 30px;
  font-size: 12px;

  &--info {
    background-color: rgba($info__bg-color, 0.2);

    .NotificationBadge__icon {
      background-image: url("../assets/icons/common/info-icon.svg");
    }
  }

  &--warning {
    background-color: rgba($warning__bg-color, 0.2);

    .NotificationBadge__icon {
      background-image: url("../assets/icons/common/warning-icon.svg");
    }
  }

  &.no-margin {
    margin: 0;
  }

  &__icon {
    width: 16px;
    height: 16px;
    margin-right: 5px;
    background-repeat: no-repeat;
    background-position: center;
    background-size: 16px;
  }
}
</style>
