<template>
  <section class="secondaryNavigation">
      <div class="secondaryNavigation__content">
        <slot></slot>
      </div>
  </section>
</template>

<script>
export default {
  name: 'SecondaryNavigation'
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.secondaryNavigation {
  position: sticky;
  z-index: $z-index__subheader;
  top: 64px;
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

header.has-user-notification + .secondaryNavigation {
  top: 64px + $notification-warning__height;
}
</style>
