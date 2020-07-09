<template>
  <Page class="page--settings">
    <div class="connectedapps grid">
      <SettingsSidebar class="grid-cell--col4" :userModel="user" :baseUrl="baseUrl" />
      <div class="conectedapps__container grid-cell--col8">
        <div class="connectedapps__title">
          <h2 class="text is-caption">{{ $t(`ConnectedAppsPage.title`) }}</h2>
        </div>

        <p v-if="hasConnectedApps" class="text is-small">{{ $t(`ConnectedAppsPage.description`) }}</p>
        <p v-else class="text is-small u-mb--96">{{ $t(`ConnectedAppsPage.emptyDescription`) }}</p>

        <div v-if="!hasConnectedApps && showOauthApps" class="u-mt--16">
          <div class="connectedapps__title">
            <h2 class="text is-caption">{{ $t(`ConnectedAppsPage.emptyTipTitle`) }}</h2>
          </div>
          <p class="text is-small"
             v-html="$t('ConnectedAppsPage.emptyTipDescription', { url: this.$router.resolve({ name: 'oauth_apps_list' }).href })">
          </p>
        </div>

        <div v-if="hasConnectedApps" class="connectedapps__list">
          <div class="connectedapps__list-title">
            <h3 class="text is-small is-semibold">{{ $t(`ConnectedAppsPage.listTitle`) }}</h3>
          </div>
          <ul>
            <AppElement v-for="connectedApp in connectedApps" :key="connectedApp.id" :oAuthApp="connectedApp">
              <button class="connectedapps__button connectedapps__button--revoke button button--ghost" @click="openModal(connectedApp)">
                {{ $t(`ConnectedAppsPage.removeAccessButton`) }}
              </button>
            </AppElement>
          </ul>
        </div>
      </div>
    </div>

    <Modal :isOpen="isModalOpen" @closeModal="closeModal">
      <div class="connectedapps__modal">
        <div class="connectedapps__modal-inner">
          <div class="connectedapps__icon u-mb--24">
            <img svg-inline src="../../assets/icons/apps/default.svg">
            <img class="connectedapps__badge" svg-inline src="../../assets/icons/apps/trash.svg">
          </div>
          <span class="text is-caption u-mb--8" v-html="$t(`ConnectedAppsPage.removeModal.title`, { name: selectedApp.name })"></span>
          <span class="text is-small is-txtSoftGrey">{{ $t(`ConnectedAppsPage.removeModal.subtitle`) }}</span>
          <div class="connectedapps__modal-actions">
            <button class="connectedapps__button button button--ghost is-primary u-mr--12" @click="closeModal">{{ $t(`ConnectedAppsPage.removeModal.cancelButton`) }}</button>
            <button class="connectedapps__button button button--alert text is-small" @click="revokeAccess(selectedApp)">{{ $t(`ConnectedAppsPage.removeModal.removeButton`) }}</button>
          </div>
        </div>
      </div>
    </Modal>
  </Page>
</template>

<script>
import Page from 'new-dashboard/components/Page';
import AppElement from '../../components/Apps/AppElement';
import SettingsSidebar from 'new-dashboard/components/Apps/SettingsSidebar';
import Modal from 'new-dashboard/components/Modal';
import { mapState } from 'vuex';
import * as accounts from 'new-dashboard/core/constants/accounts';

export default {
  name: 'ConnectedApps',
  components: {
    AppElement,
    Page,
    SettingsSidebar,
    Modal
  },
  data () {
    return {
      isModalOpen: false,
      selectedApp: {}
    };
  },
  beforeMount: function () {
    this.$store.dispatch('connectedApps/fetch', {
      apiKey: this.$store.state.user.api_key
    });
  },
  computed: {
    ...mapState({
      isFetchingConnectedApps: state => state.connectedApps.isFetching,
      user: state => state.user,
      baseUrl: state => state.user.base_url,
      planAccountType: state => state.user.account_type,
      connectedApps: state => state.connectedApps.list,
      hasConnectedApps: state => !state.connectedApps.isFetching && !!Object.keys(state.connectedApps.list).length
    }),
    showOauthApps () {
      return !accounts.accountsWithOauthAppsLimits.includes(this.planAccountType);
    }
  },
  methods: {
    openModal (selectedApp) {
      this.isModalOpen = true;
      this.selectedApp = selectedApp;
    },
    closeModal () {
      this.isModalOpen = false;
      this.selectedApp = {};
    },
    revokeAccess (selectedApp) {
      this.$store
        .dispatch('connectedApps/revoke', selectedApp)
        .then(() => {
          this.closeModal();
          this.$router.push({ name: 'app_permissions' });
        });
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.connectedapps {
  display: flex;
  width: 940px;
  min-height: 585px;
  margin: 48px auto 0;
  padding: 0;

  &__container {
    display: flex;
    width: 100;
    padding-left: 82px;
  }

  &__title {
    margin-bottom: 16px;
    padding-bottom: 28px;
    border-bottom: 1px solid $neutral--300;
  }

  &__list {
    margin-top: 36px;
  }

  &__list-title {
    padding-bottom: 24px;
    border-bottom: 1px solid $neutral--300;
  }

  &__item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px 0;
    border-bottom: 1px solid $neutral--300;
  }

  &__item-info {
    display: flex;
    flex-grow: 1;
  }

  &__item-title {
    max-width: 356px;
    line-height: 22px;
  }

  &__item-description {
    max-width: 356px;
  }

  &__icon {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border: 1px solid $neutral--300;
    border-radius: 2px;
  }

  &__badge {
    display: block;
    position: absolute;
    top: -9px;
    right: -9px;
    animation: fade-and-bounce-up 0.6s 0.35s ease-in-out backwards;
  }
}

.connectedapps__button {
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;

  &.connectedapps__button--revoke {
    align-self: center;
  }
}

.button--ghost {
  padding: 8px 12px;
  border: 1px solid $blue--500;
  background: none;
  color: $blue--500;
}

.connectedapps__modal {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 100%;
  height: 100%;
}

.connectedapps__modal-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 960px;
  margin: 0 auto;
  padding: 0;
}

.connectedapps__modal-actions {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 54px;
  padding-top: 38px;
  border-top: 1px solid $neutral--300;
}

</style>
