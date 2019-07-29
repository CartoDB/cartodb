<template>
  <div>
    <div class="oauthapps__title">
      <h2 class="text is-small is-semibold">{{ $t(`OauthAppsPage.title`) }}</h2>
      <router-link :to="{ name: 'oauth_app_new' }">
        <button class="oauthapps__button oauthapps__button--small button">{{ $t(`OauthAppsPage.newAppButton`) }}</button>
      </router-link >
    </div>
    <p v-if="!hasConnectedApps" v-html="$t(`OauthAppsPage.emptyDescription`)" class="text is-caption"></p>
    <div v-else class="oauthapps__list">
      <ul>
        <li v-for="connectedApp in connectedApps" :key="connectedApp.id" class="oauthapps__item">
          <div class="oauthapps__icon u-mr--20">
            <img svg-inline src="../../assets/icons/apps/default.svg">
          </div>
          <div class="oauthapps__item-info">
            <span class="text is-small is-semibold oauthapps__item-title">{{ connectedApp.name }}</span>
            <span class="text is-small oauthapps__item-description">{{ connectedApp.description }}</span>
          </div>
          <router-link :to="{ name: 'oauth_app_edit', params: {id: connectedApp.id } }" class="oauthapps__button button button--ghost">
            {{ $t(`OauthAppsPage.editButton`) }}
          </router-link>
        </li>
      </ul>
    </div>
    <p class="text is-small u-mt--32" v-html="$t(`OauthAppsPage.description`)"></p>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'AppList',
  data () {
    return {
      selectedApp: {}
    };
  },
  computed: {
    ...mapState({
      isFetchingApps: state => state.apps.isFetching,
      connectedApps: state => state.apps.connectedApps,
      error: state => state.apps.error,
      hasConnectedApps: state => !state.apps.isFetchingApps && state.apps.connectedApps
    })
   }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.oauthapps {
  display: flex;
  width: 940px;
  margin: 0 auto;
  padding: 0;

  &__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 28px;
    border-bottom: 1px solid $neutral--300;
  }

  &__list {
    margin-top: 36px;
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

  &__back {
    cursor: pointer;
  }
}

.button--ghost {
  padding: 8px 12px;
  border: 1px solid $blue--500;
  background: none;
  color: $blue--500;
}
</style>
