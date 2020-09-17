<template>
<div class="notification">
  <span v-html="htmlBody" class="text notification__text"></span>
  <button class="notification__close-button" @click="close" aria-label="Close">
    <img src="../assets/icons/common/close.svg" />
  </button>
</div>
</template>

<script>
export default {
  name: 'NotificationWarning',
  props: {
    htmlBody: String
  },
  methods: {
    close () {
      this.$store && this.$store.dispatch('user/hideUserNotification');
    }
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.notification {
  display: flex;
  position: fixed;
  z-index: $z-index__notification-warning;
  top: 0;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: $notification-warning__height;
  max-height: $notification-warning__height;
  padding: 16px;
  background-color: $notification__bg-color;
  color: $text__color;
  font-size: 12px;
  text-align: center;

  .notification__text {
    display: inline-block;
    width: 80%;
    line-height: 1.2;
  }

  /deep/ b {
    font-weight: 900;
  }
}

.notification__close-button {
  display: none; // TO DO: improve notification warning behaviour
  position: absolute;
  top: 0;
  right: 24px;
  height: 100%;

  img {
    width: 16px;
    height: 16px;
  }
}
</style>
