<template>
  <div class="notification">
    <span class="u-flex u-flex__align--center">
      <img src="../assets/icons/common/new-releases.svg" />
      <div class="u-flex u-flex__align--center">
        <span class="is-bold u-ml--8 u-mr--8">
          {{ $t("Carto3Release.title") }}
        </span>
        <span
          class="text"
          v-html="
            $t('Carto3Release.message', {
              link: `<a href='https://carto.com/signup' target='_blank'>${$t('Carto3Release.link')}</a>`,
              contact: `<a href='mailto:enterprise-support@carto.com' target='_blank'>${$t('Carto3Release.contactUs')}</a>`
            })
          "
        >
        </span>
      </div>
    </span>

    <!-- HACK: Non-closable banner -->
    <!-- <button
      class="notification__close-button"
      @click="close"
      aria-label="Close"
    >
      <img src="../assets/icons/common/close-black.svg" />
    </button> -->
  </div>
</template>

<script>
export default {
  name: 'NotificationCarto3Release',
  props: {},
  methods: {
    close () {
      this.$emit('onClose');
    }
  }
};
</script>
<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.notification {
  display: flex;
  position: fixed;
  z-index: $z-index__notification-warning;
  top: 0;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: $notification-warning__height;
  max-height: $notification-warning__height;
  padding: 16px 24px 16px 64px;
  background-color: $notification__bg-color;
  color: $text__color;
  font-size: 14px;

  .notification__text {
    display: inline-block;
    width: 80%;
    line-height: 1.2;
  }

  /deep/ b {
    font-weight: 900;
  }
  /deep/ a {
    font-weight: 900;
    color: $text__color;
    text-decoration: underline;
  }
}

.notification__close-button {
  img {
    width: 16px;
    height: 16px;
  }
}
</style>
