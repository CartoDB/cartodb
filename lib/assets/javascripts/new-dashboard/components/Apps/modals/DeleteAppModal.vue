<template>
  <Modal ref="deleteAppModal" name="deleteAppModal">
    <div class="oauthapps__modal">
      <div class="oauthapps__modal-inner">
        <div class="oauthapps__icon u-mb--24">
          <img class="oauthapps_svgicon" svg-inline src="new-dashboard/assets/icons/apps/default.svg">
          <img class="oauthapps__badge" svg-inline src="new-dashboard/assets/icons/apps/trash.svg">
        </div>
        <p class="text is-caption u-mb--8" v-html="$t('OAuthAppsPage.deleteModal.title', { name: app.name })"></p>
        <p class="text is-small is-txtSoftGrey" v-html="$t('OAuthAppsPage.deleteModal.subtitle')"></p>
        <div class="oauthapps__modal-actions">
          <button class="oauthapps__button button button--ghost u-mr--12" @click="close">{{ $t(`OAuthAppsPage.deleteModal.cancelButton`) }}</button>
          <button class="oauthapps__modal-button oauthapps__modal-button--delete" @click="deleteApp">{{ $t(`OAuthAppsPage.deleteModal.deleteButton`) }}</button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from 'new-dashboard/components/Modal';

export default {
  name: 'DeleteAppModal',
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
      this.$refs.deleteAppModal.open();
    },
    close () {
      this.$refs.deleteAppModal.close();
    },
    deleteApp () {
      this.$store.dispatch('oAuthApps/delete', this.app)
        .then(() => {
          this.$router.push({ name: 'oauth_apps_list' });
        });
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
@import './modal-styles.scss';
</style>
