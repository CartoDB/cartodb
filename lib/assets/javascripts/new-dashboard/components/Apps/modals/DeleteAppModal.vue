<template>
  <Modal ref="deleteAppModal" name="deleteAppModal">
    <div class="oauthapps__modal">
      <div class="oauthapps__modal-inner">
        <div class="oauthapps__icon u-mb--24">
          <img svg-inline src="new-dashboard/assets/icons/apps/default.svg">
          <img class="oauthapps__badge" svg-inline src="new-dashboard/assets/icons/apps/trash.svg">
        </div>
        <span class="text is-caption u-mb--8" v-html="$t(`OAuthAppsPage.deleteModal.title`, { name: app.name })"></span>
        <span class="text is-small is-txtSoftGrey" v-html="$t(`OAuthAppsPage.deleteModal.subtitle`)"></span>
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

.oauthapps__modal {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 100%;
  height: 100%;
}

.oauthapps__modal-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 960px;
  margin: 0 auto;
  padding: 0;
}

.oauthapps__modal-actions {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 54px;
  padding-top: 38px;
  border-top: 1px solid $neutral--300;
}

.oauthapps__modal-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border: 1px solid $color-primary;
  border-radius: 4px;
  background-color: transparent;
  color: $color-primary;
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    background-color: transparent;
    text-decoration: underline;
  }

  &--regenerate,
  &--delete {
    border: none;
    background-color: $button-alert__bg-color;
    color: $white;

    &:hover {
      background-color: $button-alert__bg-color--hover;
      text-decoration: none;
    }
  }
}

</style>
