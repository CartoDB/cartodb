<template>
<div class="notification">
  <div v-html="htmlBody" class="notification-html text is-caption"></div>
</div>
</template>

<script>
export default {
  name: 'NotificationWarning',
  props: {
    htmlBody: String
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.notification {
  color: $text__color;
  padding: 16px 112px;
  background-color: $warning__bg-color;
}
</style>
