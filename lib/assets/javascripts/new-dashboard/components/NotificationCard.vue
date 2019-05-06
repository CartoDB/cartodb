<template>
<div class="notification">
  <div class="notification-info">
    <div class="notification-received text is-small">{{ receivedAtFormatted }}</div>
    <span v-if="!readAt" class="notification-read"></span>
  </div>
  <div v-html="htmlBody" class="notification-html text is-caption" :class="{'is-unread': !readAt}"></div>
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
      return new Date(this.receivedAt).toLocaleDateString();
    }
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.notification-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.notification-received {
  color: $text__color--secondary;
}

.notification-read {
  display: block;
  width: 12px;
  height: 12px;
  margin-left: 24px;
  border-radius: 50%;
  background: $notification__bg-color;
}

.notification-html {
  margin-top: 16px;
  color: $text__color;

  &.is-unread {
    font-weight: 600;
  }
}

</style>
