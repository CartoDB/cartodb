<template>
  <Modal ref="regenerateCredentialsModal" name="regenerateCredentialsModal">
    <div class="oauthapps__modal">
      <div class="oauthapps__modal-inner">
        <div class="oauthapps__icon u-mb--24">
          <img class="oauthapps_svgicon" svg-inline src="new-dashboard/assets/icons/apps/default.svg">
          <img class="oauthapps__badge" svg-inline src="new-dashboard/assets/icons/apps/key.svg">
        </div>
        <p class="text is-caption u-mb--8" v-html="$t('OAuthAppsPage.regenerateModal.title', { name: app.name })"></p>
        <p class="text is-small is-txtSoftGrey" v-html="$t('OAuthAppsPage.regenerateModal.subtitle')"></p>
        <div class="oauthapps__modal-actions">
          <button class="oauthapps__modal-button u-mr--12" @click="close">{{ $t(`OAuthAppsPage.regenerateModal.cancelButton`) }}</button>
          <button class="oauthapps__modal-button oauthapps__modal-button--regenerate" @click="regenerateCredentials">{{ $t(`OAuthAppsPage.regenerateModal.regenerateButton`) }}</button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from 'new-dashboard/components/Modal';

export default {
  name: 'RegenerateCredentialsModal',
  components: {
    Modal
  },
  props: {
    app: {
      type: Object,
      required: true
    }
  },
  methods: {
    open () {
      this.$refs.regenerateCredentialsModal.open();
    },
    close () {
      this.$refs.regenerateCredentialsModal.close();
    },
    regenerateCredentials () {
      this.$store.dispatch('oAuthApps/regenerateCredentials', this.app);
      this.close();
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
@import './modal-styles.scss';
</style>
