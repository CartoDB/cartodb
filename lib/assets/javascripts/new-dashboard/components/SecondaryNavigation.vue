<template>
  <section class="secondaryNavigation" :class="{'has-user-notification': isNotificationVisible}">
      <div class="secondaryNavigation__content">
        <slot></slot>
      </div>
  </section>
</template>

<script>
export default {
  name: 'SecondaryNavigation',
  computed: {
    isNotificationVisible () {
      return this.$store.getters['user/isNotificationVisible'];
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.secondaryNavigation {
  position: sticky;
  z-index: $z-index__subheader;
  top: $header__height;
  padding: 0 20px;
  border-bottom: 1px solid $neutral--300;
  background-color: $white;

  &__content {
    display: flex;
    align-items: center;
    max-width: 940px;
    margin: 0 auto;
  }
}

.secondaryNavigation.has-user-notification {
  top: $header__height + $notification-warning__height;
}
</style>
