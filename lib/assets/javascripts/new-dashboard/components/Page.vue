<template>
  <section class="page" :class="{ 'is-user-notification': isNotificationVisible }">
    <slot />
  </section>
</template>

<script>

export default {
  name: 'Page',
  computed: {
    isNotificationVisible () {
      return this.$store.getters['user/isNotificationVisible'];
    }
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
</style>
