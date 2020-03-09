<template>
  <section
    class="sticky-subheader"
    :class="{ 'is-visible': $props.isVisible, 'has-user-notification': isNotificationVisible }">
    <div class="container subheader-container">
      <slot />
    </div>
  </section>
</template>

<script>
export default {
  name: 'StickySubheader',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    isNotificationVisible () {
      return this.$store.getters['user/isNotificationVisible'];
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.sticky-subheader {
  display: flex;
  position: fixed;
  z-index: $z-index__subheader;
  top: 0;
  left: 0;
  justify-content: center;
  width: 100%;
  height: 64px;
  transition: transform 200ms cubic-bezier(0.4, 0.01, 0.165, 0.99);
  border-bottom: 1px solid $border-color--dark;
  background-color: $white;

  &.is-visible {
    transform: translate3d(0, $header__height, 0);

    &.has-user-notification {
      $stickyHeaderPosition: $header__height + $notification-warning__height;
      transform: translate3d(0, $stickyHeaderPosition, 0);
    }
  }
}

.subheader-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 20px;
}
</style>
