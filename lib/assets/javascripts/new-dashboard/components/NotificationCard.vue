<template>
<div class="notification-receivedDate">{{ receivedAtFormatted }}</div>
</template>

<script>
export default {
  name: 'NotificationCard',
  props: {
    id: String,
    receivedAt: String,
    readAt: String,
    htmlBody: String
  },
  computed: {
    receivedAtFormatted () {
      const date = new Date(this.receivedAt);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }
};
</script>
<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';
</style>
