<template>
<div>
  <div class="notification-receivedDate">{{ receivedAtFormatted }}</div>
  <div v-html=htmlBody class="notification-htmlBody"></div>
  <span v-if=readAt class="notification-readCheck"></span>
</div>
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
    },
    htmlBodyText () {
      const element = document.createElement('div');
      element.innerHTML = this.htmlBody;
      return element.innerText;
    }
  }
};
</script>
<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';
</style>
