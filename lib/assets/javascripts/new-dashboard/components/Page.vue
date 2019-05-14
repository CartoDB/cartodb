<template>
  <section class="page" :class="{ 'is-user-notification': isNotificationVisible }">
    <slot />
  </section>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'Page',
  computed: {
    ...mapState({
      isNotificationVisible: state => state.user.isNotificationVisible
    })
  }
}
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.page {
  min-height: calc(100vh - 392px);
  padding: 128px 0 120px;
  border-bottom: 1px solid $border-color;
}

.page.is-user-notification {
  // padding-top: 128px + $notification-warning__height;
}
</style>
