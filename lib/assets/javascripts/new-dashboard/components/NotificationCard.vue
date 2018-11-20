<template>
<div>
  <div class="notification-receivedDate">{{ receivedAtFormatted }}</div>
  <div v-html=htmlBody class="notification-htmlBody"></div>
  <span v-if=readAt class="notification-readCheck"></span>
</div>
</template>

<script>
import format from 'date-fns/format';
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
      return format(new Date(this.receivedAt), 'DD/MM/YYYY');
    }
  }
};
</script>
<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';
</style>
